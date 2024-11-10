import { Command } from 'commander'
import { WechatyBuilder, ScanStatus, log } from 'wechaty'
import inquirer from 'inquirer'
import qrTerminal from 'qrcode-terminal'
import dotenv from 'dotenv'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { defaultMessage } from './wechaty/sendMessage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const env = dotenv.config().parsed
const { version, name } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))

let serviceType = ''

// Display QR code for scanning
function onScan(qrcode, status) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        qrTerminal.generate(qrcode, { small: true })
        console.log('onScan:', `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`, ScanStatus[status], status)
    } else {
        log.info('onScan: %s(%s)', ScanStatus[status], status)
    }
}

// Log events for login, logout, friendship request, and messages
function onLogin(user) {
    console.log(`${user} has logged in\nCurrent time: ${new Date()}\nAutomatic robot chat mode activated`)
}

function onLogout(user) {
    console.log(`${user} has logged out`)
}

async function onFriendShip(friendship) {
    const frienddShipRe = /chatgpt|chat/
    if (friendship.type() === 2 && frienddShipRe.test(friendship.hello())) {
        await friendship.accept()
    }
}

async function onMessage(msg) {
    await defaultMessage(msg, bot, serviceType)
}

// Bot initialization
const CHROME_BIN = process.env.CHROME_BIN ? { endpoint: process.env.CHROME_BIN } : {}
export const bot = WechatyBuilder.build({
    name: 'WechatEveryDay',
    puppet: 'wechaty-puppet-wechat4u',
    puppetOptions: { uos: true, ...CHROME_BIN },
})

bot.on('scan', onScan)
    .on('login', onLogin)
    .on('logout', onLogout)
    .on('message', onMessage)
    .on('friendship', onFriendShip)
    .on('error', (e) => {
        console.error('❌ bot error:', e)
    })

// Start the bot
function botStart() {
    bot.start()
        .then(() => console.log('Start to log in wechat...'))
        .catch((e) => console.error('❌ botStart error:', e))
}

// Service selection logic with environment validation
const requiredKeys = {
    ChatGPT: ['OPENAI_API_KEY'],
    Kimi: ['KIMI_API_KEY'],
    Xunfei: ['XUNFEI_APP_ID', 'XUNFEI_API_KEY', 'XUNFEI_API_SECRET'],
    'deepseek-free': ['DEEPSEEK_FREE_URL', 'DEEPSEEK_FREE_TOKEN', 'DEEPSEEK_FREE_MODEL'],
    '302AI': ['_302AI_API_KEY'],
    dify: ['DIFY_API_KEY', 'DIFY_URL'],
    ollama: ['OLLAMA_URL', 'OLLAMA_MODEL'],
    tongyi: ['TONGYI_URL', 'TONGYI_MODEL'],
}

function handleStart(type) {
    serviceType = type
    console.log('🌸🌸🌸 / type:', type)

    const keys = requiredKeys[type]
    if (!keys) {
        console.log('❌ 服务类型错误, 目前支持： ChatGPT | Kimi | Xunfei | DIFY | OLLAMA | TONGYI')
        return
    }

    const missingKeys = keys.filter((key) => !env[key])
    if (missingKeys.length === 0) {
        botStart()
    } else {
        console.log(`❌ 请先配置.env文件中的 ${missingKeys.join('，')}`)
    }
}

// Initialize service type from .env or prompt user selection
const serveList = Object.keys(requiredKeys).map((key) => ({ name: key, value: key }))
const questions = [{ type: 'list', name: 'serviceType', message: '请先选择服务类型', choices: serveList }]

function init() {
    if (env.SERVICE_TYPE && serveList.some((item) => item.value === env.SERVICE_TYPE)) {
        handleStart(env.SERVICE_TYPE)
    } else {
        inquirer
            .prompt(questions)
            .then((res) => handleStart(res.serviceType))
            .catch((error) => console.log('❌ inquirer error:', error))
    }
}

// CLI setup using commander
const program = new Command(name)
program
    .alias('we')
    .description('🤖基于 WeChaty 结合AI服务的微信机器人。')
    .version(version, '-v, --version, -V')
    .option('-s, --serve <type>', '跳过交互，直接设置启动的服务类型')
    .action(() => {
        const { serve } = program.opts()
        if (!serve) init()
        else handleStart(serve)
    })
    .command('start')
    .option('-s, --serve <type>', '跳过交互，直接设置启动的服务类型', '')
    .action(() => init())

program.parse()
