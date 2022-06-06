import { setupDevtoolsPlugin, DevtoolsPluginApi } from '@vue/devtools-api'
import { toRaw } from 'vue-demi';

// import { App } from 'vue'
import { MyPluginData } from './data'


let copyOfState: any = {};

// copyOfState : {
//   state : [ 
//     proxy {
//       <target> : {
//         counter : 0,
//         colorCode : 'blue'
//       }
//     }
//   ]
// }


//copyOfState[stateName][0].target => undefined

export const getCompState = (state: object, stateName: string): void => {

  console.log("copyOfState:", copyOfState);
  // shallowref of state?
  if (!copyOfState[stateName]) {
    copyOfState[stateName] = [];
  }
  copyOfState[stateName].push(state)
  console.log(copyOfState[stateName][0]["<target>"])
}

export function setupDevtools(app: any, data: MyPluginData) {
  const stateType: string = 'My Awesome Plugin state'
  const inspectorId = 'my-awesome-plugin'
  const timelineLayerId = 'my-awesome-plugin'







  let devtoolsApi: DevtoolsPluginApi<{}>

  let trackId = 0

  const devtools = {
    trackStart: (label: string) => {
      const groupId = 'track' + trackId++

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
      })

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
        })
      }
    }
  }

  setupDevtoolsPlugin({
    id: 'my-awesome-devtools-plugin',
    label: 'My Awesome Plugin',
    packageName: 'my-awesome-plugin',
    homepage: 'https://vuejs.org',
    componentStateTypes: [stateType],
    app
  }, api => {
    devtoolsApi = api

    api.on.inspectComponent((payload, context) => {
      payload.instanceData.state.push({
        type: stateType,
        key: '$hello',
        value: data.message,
        editable: false
      })

      payload.instanceData.state.push({
        type: stateType,
        key: 'time counter',
        value: data.counter,
        editable: false
      })
    })

    setInterval(() => {
      api.notifyComponentUpdate()
    }, 5000)

    api.on.visitComponentTree((payload, context) => {
      const node = payload.treeNode
      if (payload.componentInstance.type.meow) {
        node.tags.push({
          label: 'meow',
          textColor: 0x000000,
          backgroundColor: 0xff984f
        })
      }
    })

    api.addInspector({
      id: inspectorId,
      label: 'Point-Of-Vue!',
      icon: 'pets',
    })
    // example app payload.rootNodes
    // [
    //   {
    //     id: 'root',
    //     label: 'Awesome root',
    //     children: [
    //       {
    //         id: 'child-1',
    //         label: 'Child 1',
    //         tags: [
    //           {
    //             label: 'awesome',
    //             textColor: 0xffffff,
    //             backgroundColor: 0x000000
    //           }
    //         ]
    //       },
    //       {
    //         id: 'child-2',
    //         label: 'Child 2'
    //       }
    //     ]
    //   },
    //   {
    //     id: 'root2',
    //     label: 'Amazing root'
    //   }
    // ]

    // copyOfState : {
//   state : [ 
//     proxy {
//       <target> : {
//         counter : 0,
//         colorCode : 'blue'
//       }
//     }
//   ]
// }

    api.on.getInspectorTree((payload, context) => {
      if (payload.inspectorId === inspectorId) {
        payload.rootNodes = [];
        for (const key in copyOfState){
          payload.rootNodes.push({
            id: `${key}`,
            label: `${key}`
          })
        }
      }
    })
    // 'my section': [
    //   {
    //     key: 'cat',
    //     value: 'meow',
    //     editable: false,
    //   }
    // ]
    api.on.getInspectorState((payload, context) => {
      if (payload.inspectorId === inspectorId) {
        if (copyOfState[payload.nodeId]) {
          payload.state = {};
          const stateObj = toRaw(copyOfState[payload.nodeId][copyOfState[payload.nodeId].length - 1]);
          console.log('getInspectorState is running')
          console.log('stateObj:', stateObj)
          console.log("copyOfState[payload.nodeId][0] keys", Object.keys(copyOfState[payload.nodeId][0]))
          console.log('toRaw:', toRaw(copyOfState[payload.nodeId][0]))
          for (const key in stateObj){
            payload.state[key] = [
              {
              key: key,
              value: stateObj[key],
              editable: false
              }
            ]
          }
        }
      }
    })

    api.addTimelineLayer({
      id: timelineLayerId,
      color: 0xff984f,
      label: 'Point-Of-Vue'
    })

    // window.addEventListener('click', event => {
    //   api.addTimelineEvent({
    //     layerId: timelineLayerId,
    //     event: {
    //       time: Date.now(),
    //       data: {
    //         mouseX: event.clientX,
    //         mouseY: event.clientY
    //       }
    //     }
    //   })
    // })
    window.addEventListener('click', event => {
      const groupId = 'group-1'

      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now(),
          data: {
            label: 'group test'
          },
          title: 'group test',
          groupId
        }
      })

      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now() + 10,
          data: {
            label: 'group test (event 2)',
          },
          title: 'group test',
          groupId
        }
      })

      devtoolsApi.addTimelineEvent({
        layerId: timelineLayerId,
        event: {
          time: Date.now() + 20,
          data: {
            label: 'group test (event 3)',
          },
          title: 'group test',
          groupId
        }
      })
    })
  })

  return devtools
}
