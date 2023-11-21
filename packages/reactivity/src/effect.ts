let activeEffect = undefined

// 清空当前effect
const cleanupEffect = (effect) => {
    const { deps } = effect
    deps.forEach(dep => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}

class ReactiveEffect {
    // 父级effect 处理嵌套effect情况
    public parent = null;
    // 当前effect是否激活
    public active = true
    // 属性对应effect合集中有当前effect的所有Set 类型: [Set, Set]
    public deps = []
    constructor(public fn, public scheduler) {}

    run() {
        if (!this.active) {
            this.fn()
            return
        }
        try {
            this.parent = activeEffect
            activeEffect = this
            // 执行重新渲染之前 清空之前收集的当前effect 让有分支语句的effect正确收集依赖  例如: state.flag ? state.name : state.name
            cleanupEffect(this)
            // 执行fn 重新收集当前effect依赖
            return this.fn()
        } finally {
            activeEffect = this.parent
            this.parent = null
        }
    }
    stop() {
        if (!this.active) {
            this.active = false
        }
        cleanupEffect(this)
    }
}


export const effect = (fn, options: any = {}) => {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run()
    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

// { 对象: Map{ 属性: Set[ effects ] } } 存放响应式对象属性和effect的对应关系
const targetMap = new WeakMap()

// 读取响应式对象属性时运行
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
    let effects = depsMap.get(key)
    effects = new Set(effects)
    effects && effects.forEach(effect => {
        if (effect !== activeEffect) {
            if (effect.scheduler) {
                effect.scheduler()
            } else {
                effect.run()
            }
        }
    })
}