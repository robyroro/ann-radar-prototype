import {AdminLayerType} from '@/types/admin-layers';
import {
  ScorecardMeasureId,
  ScorecardRating,
  ScorecardType
} from '@/types/scorecards';
import {RootState, StoreState} from '@/types/store';

import {ActionContext} from 'vuex';

import {doc, getDoc} from 'firebase/firestore';
import {database} from '../../libs/firebase';
import {ANNRadarCollection} from '@/types/firestore';

const scorecardURLs = {
  [ScorecardType.PLANS]:
    'https://storage.googleapis.com/ann-radar-data/plans_scorecard.json',
  [ScorecardType.STAKEHOLDERS]:
    'https://storage.googleapis.com/ann-radar-data/stakeholders_scorecard.json',
  [ScorecardType.URBAN_DATA]:
    'https://storage.googleapis.com/ann-radar-data/urban_data_scorecard.json',
  [ScorecardType.GOVERNANCE]:
    'https://storage.googleapis.com/ann-radar-data/governance_scorecard.json'
};

const actions = {
  async fetchScenario(
    {commit}: ActionContext<RootState, StoreState>,
    scenarioId: string
  ) {
    try {
      const scenarioRef = doc(
        database,
        ANNRadarCollection.SCENARIOS,
        scenarioId
      );
      const scenarioSnapshot = await getDoc(scenarioRef);

      if (scenarioSnapshot.exists()) {
        const scenario = scenarioSnapshot.data();
        const {
          balancedScorecardsRef,
          notesRef,
          baseLayerTypes,
          ...scenarioMetaData
        } = scenario;

        const balancedScorecardRatingsSnapshot = await getDoc(
          balancedScorecardsRef
        );
        const balancedScorecardRatings =
          balancedScorecardRatingsSnapshot.data();

        const notesSnapshot = await getDoc(notesRef);
        const notes = notesSnapshot.data();

        commit('setScenarioMetaData', {
          id: scenarioSnapshot.id,
          balancedScorecardsId: balancedScorecardRatingsSnapshot.id,
          notesId: notesSnapshot.id,
          ...scenarioMetaData
        });
        commit('setBaseLayerTypes', baseLayerTypes);
        commit('setBalancedScorecardRatings', balancedScorecardRatings);
        commit('setNotes', notes);
      } else {
        console.error('Error loading scenario', scenarioId);
      }
    } catch (error) {
      console.error('Error loading scenario', scenarioId, ':', error);
    }
  },
  fetchLayersConfig({commit}: ActionContext<RootState, StoreState>) {
    return fetch(
      'https://storage.googleapis.com/ann-radar-data/layers_config.json'
    )
      .then(response => response.json())
      .then(data => {
        commit('setLayersConfig', data);
      })
      .catch(error => console.error(error));
  },
  fetchBalancedScorecard(
    {commit}: ActionContext<RootState, StoreState>,
    type: ScorecardType
  ) {
    return fetch(scorecardURLs[type])
      .then(response => response.json())
      .then(scorecard => {
        commit('setBalancedScorecard', {type, scorecard});
      })
      .catch(error => console.error(error));
  },
  async fetchBalancedScorecardRatings({
    commit,
    state
  }: ActionContext<RootState, StoreState>) {
    if (!state.scenarioMetaData?.balancedScorecardsId) {
      return;
    }

    try {
      const balancedScorecardsRatingsRef = doc(
        database,
        ANNRadarCollection.BALANCED_SCORECARDS,
        state.scenarioMetaData.balancedScorecardsId
      );
      const balancedScorecardsRatingsSnapshot = await getDoc(
        balancedScorecardsRatingsRef
      );

      if (balancedScorecardsRatingsSnapshot.exists()) {
        commit(
          'setBalancedScorecardRatings',
          balancedScorecardsRatingsSnapshot.data()
        );
      }
    } catch (error) {
      console.error('Error loading balanced scorecard ratings:', error);
    }
  },
  updateBalancedScorecardRatings(
    {commit, state}: ActionContext<RootState, StoreState>,
    payload: {
      scorecardType: ScorecardType;
      adminLayerType: AdminLayerType;
      featureId: string;
      measureId: ScorecardMeasureId;
      rating: ScorecardRating;
    }
  ) {
    const ratings = {...state.balancedScorecardRatings};
    ratings[payload.scorecardType] = ratings[payload.scorecardType] || {};
    ratings[payload.scorecardType][payload.adminLayerType] =
      ratings[payload.scorecardType][payload.adminLayerType] || {};
    ratings[payload.scorecardType][payload.adminLayerType][payload.featureId] =
      ratings[payload.scorecardType][payload.adminLayerType][
        payload.featureId
      ] || {};

    if (payload.rating.value === undefined && !payload.rating.comment) {
      delete ratings[payload.scorecardType][payload.adminLayerType][
        payload.featureId
      ][payload.measureId];
    } else {
      ratings[payload.scorecardType][payload.adminLayerType][payload.featureId][
        payload.measureId
      ] = payload.rating;
    }

    commit('setBalancedScorecardRatings', ratings);
  }
};

export default actions;
