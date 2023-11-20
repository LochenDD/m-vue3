import { isObject } from "@vue/shared";
import { ReactiveFlags, mutableHandler } from './baseHandler'


// WeakMap 只能用对象或Symbol当键名 不会阻止键对象被垃圾回收
const reactiveMap = new WeakMap()

export function reactive(target) {
    if (!isObject(target)) {
        return
    }
    // 已经被reactive代理过的 返回自己
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }
    // 同一个值多次调用 返回同一个proxy
    const existingProxy = reactiveMap.get(target)
    if (existingProxy) {
        return existingProxy
    }
    const proxy = new Proxy(target, mutableHandler)
    reactiveMap.set(target, proxy)
    return proxy
}