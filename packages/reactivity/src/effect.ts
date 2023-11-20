let activeEffect = undefined

class ReactiveEffect {
    // 父级effect 处理嵌套effect情况
    public parent = null;
    // 当前effect是否激活
    public active = true
    public deps = []
    constructor(public fn) {}

    run() {
        try {
            this.parent = activeEffect
            activeEffect = this
            return this.fn()
        } finally {
            activeEffect = this.parent
            this.parent = null
        }
    }
}


export const effect = (fn) => {
    const _effect = new ReactiveEffect(fn);
    _effect.run()
}

// { 对象: Map{ 属性: Set[ effects ] } }
const targetMap = new WeakMap()
export const track = (target, type, key) => {
    if (!activeEffect) {
        return
    }
    // 存放对象内和
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        // (depsMap = new Map()) 先赋值后将depsMap变量作为值放在这个地方
        targetMap.set(target, (depsMap = new Map()))
    } 
    // 存放effect的合集 是个Set
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    const shouldTrack = !dep.has(activeEffect)
    if (shouldTrack) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}

export const trigger = (target, type, key, value, oldValue) => {
    const depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const effects = depsMap.get(key)
    effects && effects.forEach(effect => {
        if (effect !== activeEffect) {
            effect.run()
        }
    })
}