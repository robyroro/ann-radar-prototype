import Vue from 'vue';
import Vuex from 'vuex';
import {AdminLayerType} from '@/types/admin-layers';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    mapStyle: 'farbig',
    baseLayerTypes: [],
    adminLayerType: null as AdminLayerType | null,
    selectedFeatureDataKeys: {} as Record<
      AdminLayerType,
      {featureId: string; featureName: string}
    >
  },
  mutations: {
    setAdminLayerType(state, newAdminLayerType) {
      state.adminLayerType = newAdminLayerType;
    },
    setMapStyle(state, newMapStyle) {
      state.mapStyle = newMapStyle;
    },
    setBaseLayerTypes(state, newBaseLayerTypes) {
      state.baseLayerTypes = newBaseLayerTypes;
    },
    setSelectedFeatureDataKeys(state, payload) {
      state.selectedFeatureDataKeys = {
        ...state.selectedFeatureDataKeys,
        [payload.layerType]: payload.keys
      };
    }
  }
});

export default store;
