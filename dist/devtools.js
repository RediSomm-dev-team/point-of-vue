import { setupDevtoolsPlugin } from '@vue/devtools-api';
import { toRaw } from 'vue-demi';
import deepCopy from './deepCopy';
let copyOfState = {};
// export const getCompState = (state: object, stateName: string): void => {
//   console.log("copyOfState:", copyOfState);
//   if (!copyOfState[stateName]) {
//     copyOfState[stateName] = [];
//   };
//   copyOfState[stateName].push(state);
// };
/* Plugin Functionality */
export function setupDevtools(app) {
    const stateType = 'POV Plugin State';
    const inspectorId = 'point-of-vue-plugin';
    const timelineLayerId = 'pov-state';
    let devtoolsApi;
    let trackId = 0;
    const devtools = {
        trackStart: (label) => {
            const groupId = 'track' + trackId++;
            devtoolsApi.addTimelineEvent({
                layerId: timelineLayerId,
                event: {
                    time: Date.now(),
                    data: {
                        label
                    },
                    title: label,
                    groupId
                }
            });
            return () => {
                devtoolsApi.addTimelineEvent({
                    layerId: timelineLayerId,
                    event: {
                        time: Date.now(),
                        data: {
                            label,
                            done: true
                        },
                        title: label,
                        groupId
                    }
                });
            };
        }
    };
    setupDevtoolsPlugin({
        id: 'point-of-vue-plugin',
        label: 'Point Of Vue Plugin',
        packageName: 'point-of-vue',
        homepage: 'https://vuejs.org',
        componentStateTypes: [stateType],
        enableEarlyProxy: true,
        app
    }, api => {
        devtoolsApi = api;
        api.addInspector({
            id: inspectorId,
            label: 'Point-Of-Vue!',
            icon: 'visibility',
        });
        api.on.getInspectorTree((payload, context) => {
            //console.log("getInspectorTree payload:", payload)
            if (payload.inspectorId === inspectorId) {
                payload.rootNodes = [];
                for (const key in copyOfState) {
                    payload.rootNodes.push({
                        id: `${key}`,
                        label: `${key}`
                    });
                }
            }
        });
        api.on.getInspectorState((payload) => {
            //console.log('payload', payload)
            if (payload.inspectorId === inspectorId) {
                if (copyOfState[payload.nodeId]) {
                    payload.state = {};
                    const stateObj = toRaw(copyOfState[payload.nodeId][copyOfState[payload.nodeId].length - 1]);
                    for (const key in stateObj) {
                        payload.state[key] = [
                            {
                                key: key,
                                value: stateObj[key],
                                editable: false
                            }
                        ];
                    }
                }
            }
        });
        setInterval(() => {
            api.sendInspectorTree(inspectorId);
        }, 500);
        // let stateArr
        api.on.inspectComponent((payload, context) => {
            //console.log("inspectComponent payload:", payload)
            // stateArr = deepCopy(payload.instanceData.state)
            const stateArr = payload.instanceData.state;
            stateArr.forEach(obj => {
                if (obj.type === 'provided') {
                    const valArr = Object.values(obj.value);
                    const keyArr = Object.keys(obj.value);
                    for (let i = 0; i < valArr.length; i++) {
                        const types = Object.values(valArr[i]).map(el => typeof el);
                        if (!types.includes('function')) {
                            copyOfState[keyArr[i]] = [deepCopy(valArr[i])];
                            window.addEventListener('click', event => {
                                copyOfState[keyArr[i]].push(deepCopy(valArr[i]));
                                console.log("copyOfState:", copyOfState);
                            });
                            window.addEventListener('keyup', event => {
                                copyOfState[keyArr[i]].push(deepCopy(valArr[i]));
                                console.log("copyOfState:", copyOfState);
                            });
                            console.log('copy of state', copyOfState);
                        }
                    }
                }
            });
            // window.addEventListener('keyup', event => {
            //   copyOfState[stateName].push(deepCopy(state));
            //   console.log("copyOfState:", copyOfState)
            // })
        });
        api.addTimelineLayer({
            id: timelineLayerId,
            color: 0xff984f,
            label: 'Point-Of-Vue'
        });
        let eventCounter = 1;
        const getEventState = (index) => {
            const eventState = {};
            for (const key in copyOfState) {
                eventState[key] = copyOfState[key][index];
            }
            return eventState;
        };
        window.addEventListener('click', event => {
            const groupId = 'group-1';
            devtoolsApi.addTimelineEvent({
                layerId: timelineLayerId,
                event: {
                    time: Date.now(),
                    data: getEventState(eventCounter),
                    title: `event ${eventCounter}`,
                    groupId
                }
            });
            eventCounter += 1;
        });
        window.addEventListener('keyup', event => {
            const groupId = 'group-1';
            devtoolsApi.addTimelineEvent({
                layerId: timelineLayerId,
                event: {
                    time: Date.now(),
                    data: getEventState(eventCounter),
                    title: `event ${eventCounter}`,
                    groupId
                }
            });
            eventCounter += 1;
        });
    });
    return devtools;
}
;
