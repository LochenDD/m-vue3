import { isObject } from '@vue/shared'
import { track, trigger } from './effect'
import { reactive } from './reactive'

export const enum ReactiveFlags {
    // 标志位 代表已被reactive代理
    IS_REACTIVE = '__v_isReactive'
}

export const mutableHandler = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        track(target, 'get', key)
        // 为了能在取对象的getter时能再次触发proxy的get方法 从而收集到getter中拿到的属性
        // 直接使用target[key]的话  取alias的时候只会触发一次proxy的get方法 没有收集到使用了name属性
        const res = Reflect.get(target, key, receiver)
        if (isObject(res)) {
            return reactive(res)
        }
        return res
    },
    set(target, key, value, receiver) {
        const oldValue = target[key]
        const result = Reflect.set(target, key, value, receiver)
        if (oldValue !== value) {
            trigger(target, 'set', key, value, oldValue)
        }
        return result
    }
}