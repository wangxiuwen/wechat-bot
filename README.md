# WeChat Bot

一个 基于 `aigc` + `wechaty` 的微信机器人

可以用来帮助你自动回复微信消息，或者管理微信群/好友.

`简单`，`好用`，`2分钟（4 个步骤）` 就能玩起来了。🌸 如果对您有所帮助，请点个 Star ⭐️ 支持一下。

## 开发/使用

`nodejs` 版本需要满足 >= v18.0 ，版本太低会导致运行报错, 最好使用 LTS 版本。

```sh
npm config set registry https://registry.npmmirror.com`
yarn
yarn dev
```

然后就可以扫码登录了，然后根据你的需求，自己修改相关逻辑文件。

```sh
# 运行指定服务
npm run start -- --serve Kimi
# 交互选择服务
npm run start
```

3. 测试

安装完依赖后，运行 `npm run dev` 前，可以先测试下 openai 的接口是否可用，运行 `npm run test` 即可。遇到 timeout 问题需要自行解决。（一般就是代理未成功，或者你的梯子限制了调 openai api 的服务）

在.env 文件中修改你的配置即可，示例如下

```sh
# 定义机器人的名称，这里是为了防止群聊消息太多，所以只有艾特机器人才会回复，
# 这里不要把@去掉，在@后面加上你启动机器人账号的微信名称
BOT_NAME=@图书管理员

#自动回复前缀匹配，文本消息匹配到指定前缀时，才会触发自动回复，不配或配空串情况下该配置不生效（适用于用大号，不期望每次被@或者私聊时都触发自动回复的人群）
#匹配规则：群聊消息去掉${BOT_NAME}并trim后进行前缀匹配，私聊消息trim后直接进行前缀匹配
AUTO_REPLY_PREFIX=''
```

### 运行报错等问题

首先你需要做到以下几点：

-   拉取最新代码，重新安装依赖（删除 lock 文件，删除 node_modules）
-   安装依赖时最好不要设置 npm 镜像
-   遇到 puppeteer 安装失败设置环境变量：

    ```
    # Mac
    export PUPPETEER_SKIP_DOWNLOAD='true'

    # Windows
    SET PUPPETEER_SKIP_DOWNLOAD='true'
    ```

## 使用 Docker 部署

```sh
$ docker build . -t wechat-bot
$ docker run -d --rm --name wechat-bot -v $(pwd)/.env:/app/.env wechat-bot
```

## License

[MIT](./LICENSE).
