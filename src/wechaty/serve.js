/**
 * 获取ai服务
 * @param serviceType 服务类型
 * @returns {Promise<Function>} 返回异步加载的统一 AI 回复函数 `getReply`
 */
export async function getServe(serviceType) {
    try {
        const modulePath = `../${serviceType.toLowerCase()}/index.js`
        const module = await import(modulePath)
        return module.getReply
    } catch (error) {
        console.error(`❌ 无法加载模块: ${serviceType}, 请检查模块名称是否正确。`, error)
        const module = await import('../openai/index.js')
        return module.getReply
    }
}
