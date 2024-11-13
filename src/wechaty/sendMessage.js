import dotenv from 'dotenv'
// 加载环境变量
dotenv.config()
const env = dotenv.config().parsed // 环境参数

// 从环境变量中导入机器人的名称
const botName = env.BOT_NAME

// 从环境变量中导入需要自动回复的消息前缀，默认配空串或不配置则等于无前缀
const autoReplyPrefix = env.AUTO_REPLY_PREFIX ? env.AUTO_REPLY_PREFIX : ''

import { getServe } from './serve.js'
const imagePath = './images/'

/**
 * 默认消息发送
 * @param msg
 * @param bot
 * @param ServiceType 服务类型 'GPT' | 'Kimi'
 * @returns {Promise<void>}
 */
export async function defaultMessage(msg, bot, ServiceType = 'GPT') {
    const getReply = await getServe(ServiceType)

    const contact = msg.talker() // 发消息人
    const receiver = msg.to() // 消息接收人
    const content = msg.text() // 消息内容
    const room = msg.room() // 是否是群消息
    const roomName = (await room?.topic()) || null // 群名称
    const alias = (await contact.alias()) || (await contact.name()) // 发消息人昵称
    const remarkName = await contact.alias() // 备注名称

    const name = await contact.name() // 微信名称
    const isBotSelf = botName === `@${remarkName}` || botName === `@${name}` // 是否是机器人自己

    if (isBotSelf) return // 如果是机器人自己发送的消息则不处理
    try {
        let fileName = ''
        if (msg.type() === bot.Message.Type.Image) {
            try {
                console.log('收到图片消息，准备下载...')

                // 创建文件流
                const fileBox = await msg.toFileBox()

                // 保存文件到本地
                fileName = imagePath + fileBox.name
                await fileBox.toFile(fileName, true)
                console.log(`文件已保存到：${fileName}`)
            } catch (error) {
                console.error('保存文件出错:', error)
            }
        }
        // 区分群聊和私聊
        // 群聊消息去掉艾特主体后，匹配自动回复前缀
        if (room && content.includes(`${botName}`) && content.replace(`${botName}`, '').trimStart().startsWith(`${autoReplyPrefix}`)) {
            const question = (await msg.mentionText()) || content.replace(`${botName}`, '').replace(`${autoReplyPrefix}`, '') // 去掉艾特的消息主体
            console.log('🌸🌸🌸 / question: ', question)
            const response = await getReply(question, msg.type(), bot.Message.Type, fileName)
            await room.say(response)
        }
        // 私人聊天直接匹配自动回复前缀
        if (!room && content.trimStart().startsWith(`${autoReplyPrefix}`)) {
            const question = content.replace(`${autoReplyPrefix}`, '')
            console.log('🌸🌸🌸 / content: ', question)
            const response = await getReply(question, msg.type(), bot.Message.Type, fileName)
            await contact.say(response)
        }
    } catch (e) {
        console.error(e)
    }
}

/**
 * 分片消息发送
 * @param message
 * @param bot
 * @returns {Promise<void>}
 */
export async function shardingMessage(message, bot) {
    const talker = message.talker()
    const isText = message.type() === bot.Message.Type.Text // 消息类型是否为文本
    if (talker.self() || message.type() > 10 || (talker.name() === '微信团队' && isText)) {
        return
    }
    const text = message.text()
    const room = message.room()
    if (!room) {
        console.log(`Chat GPT Enabled User: ${talker.name()}`)
        const response = await getChatGPTReply(text)
        await trySay(talker, response)
        return
    }
    let realText = splitMessage(text)
    // 如果是群聊但不是指定艾特人那么就不进行发送消息
    if (text.indexOf(`${botName}`) === -1) {
        return
    }
    realText = text.replace(`${botName}`, '')
    const topic = await room.topic()
    const response = await getChatGPTReply(realText)
    const result = `${realText}\n ---------------- \n ${response}`
    await trySay(room, result)
}

// 分片长度
const SINGLE_MESSAGE_MAX_SIZE = 500

/**
 * 发送
 * @param talker 发送哪个  room为群聊类 text为单人
 * @param msg
 * @returns {Promise<void>}
 */
async function trySay(talker, msg) {
    const messages = []
    let message = msg
    while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
        messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE))
        message = message.slice(SINGLE_MESSAGE_MAX_SIZE)
    }
    messages.push(message)
    for (const msg of messages) {
        await talker.say(msg)
    }
}

/**
 * 分组消息
 * @param text
 * @returns {Promise<*>}
 */
async function splitMessage(text) {
    let realText = text
    const item = text.split('- - - - - - - - - - - - - - -')
    if (item.length > 1) {
        realText = item[item.length - 1]
    }
    return realText
}
