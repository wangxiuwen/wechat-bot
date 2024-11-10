import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { readFileSync } from 'fs'

const env = dotenv.config().parsed // 环境参数
// 加载环境变量
dotenv.config()
const url = env.TONGYI_URL
const api_key = env.TONGYI_API_KEY
let model_name = env.TONGYI_MODEL || 'qwen-plus'

const openai = new OpenAI({
    apiKey: api_key,
    baseURL: url,
    temperature: 0,
})

const __dirname = path.resolve()
// 判断是否有 .env 文件, 没有则报错
const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
    console.log('❌ 请先根据文档，创建并配置 .env 文件！')
    process.exit(1)
}

const encodeImage = (imagePath) => {
    const imageFile = readFileSync(imagePath)
    return imageFile.toString('base64')
}

export async function getReply(prompt, msgType, type, fileName) {
    let content = ''
    if (msgType === type.Text) {
        content = [
            {
                type: 'text',
                text: prompt,
            },
        ]
    } else if (msgType === type.Image) {
        model_name = 'qwen-vl-max-latest'
        const base64Image = encodeImage(fileName)

        content = [
            {
                type: 'text',
                text: '用中文回答',
            },
            {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
        ]
    }

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'user',
                content: content,
            },
        ],
        model: model_name,
    })

    console.log('🚀🚀🚀 / prompt', prompt)
    const Content = await completion.choices[0].message.content
    console.log('🚀🚀🚀 / reply', Content)
    return `${Content}`
}
