import { findDom, compareTwoVDom } from "../react-dom";
export let updateQueue = {
  isBathingUpdate: false,
  updaters: new Set(),
  batchUpdate() {
    updateQueue.isBathingUpdate = false;
    for (let updater of updateQueue.updaters) {
      updater.updateComponent();
    }
    updateQueue.updaters.clear();
  },
};

class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance;

    this.pendingStates = [];
  }

  addState(partialState) {
    this.pendingStates.push(partialState);
    this.emitUpdate();
  }

  emitUpdate() {
    if (updateQueue.isBathingUpdate) {
      updateQueue.updaters.add(this);
    } else {
      this.updateComponent();
    }
  }

  updateComponent() {
    const { classInstance, pendingStates } = this;
    if (pendingStates.length) {
      this.shouldUpdate(classInstance, this.getStates());
    }
  }

  shouldUpdate(classInstance, state) {
    let willUpdate = true;
    if (
      classInstance.shouldComponentUpdate &&
      !classInstance.shouldComponentUpdate()
    ) {
      willUpdate = false;
    }

    if (willUpdate && classInstance.componentWillUpdate) {
      classInstance.componentWillUpdate();
    }
    classInstance.state = state;
    if (willUpdate) {
      classInstance.forceUpdate();
    }
  }

  getStates() {
    const { classInstance, pendingStates } = this;
    let { state } = classInstance;
    pendingStates.forEach((nextState) => (state = { ...state, ...nextState }));
    return state;
  }
}

export class Component {
  static isReactComponent = true;
  constructor(props) {
    this.props = props;
    this.state = {};

    this.updater = new Updater(this);
  }

  setState(partialState) {
    this.updater.addState(partialState);
  }

  forceUpdate() {
    const oldRenderVDom = this.oldRenderVDom;
    const oldDom = findDom(oldRenderVDom);
    const newRenderVDom = this.render();

    compareTwoVDom(oldDom.parentNode, oldRenderVDom, newRenderVDom);
    this.oldRenderVDom = newRenderVDom;
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props, this.state);
    }
  }
}
