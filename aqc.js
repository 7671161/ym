/* 
 cron "2-59/10 7-23 * * *" ql_aiqichaShop.js

 爱妻查商城监控  
 多商品请用逗号分割 格式:AQ03006,AQ03007,AQ03008 青龙变量aqcGood
 默认定时每10分钟一次 如需自定义请自己设置cron

 AQ03006 爱奇艺月卡
 AQ03007 爱奇艺季卡
 AQ03008 京东50E卡
 AQ03009 百度网盘会员月卡
 AQ03010 百度网盘超级会员月卡

 仓库地址:https://github.com/WindFgg/Scripts
*/
const $ = new Env("爱妻查商城监控");
const axios = require("axios")
const notify = $.isNode() ? require("./sendNotify") : "";
aqcookie = $.isNode() ? process.env.aqcCookies : "";
aqcGoods = $.isNode() ? process.env.aqcGood : "";
aqcookieArr = [];
aqcookieGoodsArr = [];
timeout = 10000
PUSH_PLUS_USER_AQC = process.env.PUSH_PLUS_USER_AQC ? process.env.PUSH_PLUS_USER_AQC : ''
PUSH_PLUS_TOKEN_AQC = process.env.PUSH_PLUS_TOKEN_AQC ? process.env.PUSH_PLUS_TOKEN_AQC : ''
TG_BOT_TOKEN_AQC = process.env.TG_BOT_TOKEN_AQC ? process.env.TG_BOT_TOKEN_AQC : ''
TG_USER_ID_AQC = process.env.TG_USER_ID_AQC ? process.env.TG_USER_ID_AQC : ''

var goodsDic = {
    AQ03006: "爱奇艺月卡",
    AQ03007: "爱奇艺季卡",
    AQ03008: "京东50E卡",
    AQ03009: "百度网盘会员月卡",
    AQ03010: "百度网盘超级会员月卡",
}

var headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36 Edg/96.0.1054.43',
    'Referer': 'https://qiye.baidu.com/usercenter',
    'Cookie': ''
};

async function checkEK () {
    return new Promise(async (resolve) => {
        try {
            res = await axios.get(`https://qiye.baidu.com/usercenter/getBenefitStatusAjax`, {
                headers
            })
            msg = ''
            //console.log(res)
            if (res.data.status == 0) {
                var GoodsData = res.data.data;
                if (aqcookieGoodsArr.length <= 0) {
                    msg += '当前未配置任何监控商品,请查看脚本注释添加aqcGood变量'
                } else {
                    for (a = 0; a < aqcookieGoodsArr.length; a++) {
                        var good = aqcookieGoodsArr[a]
                        var goodName = goodsDic[good]
                        if (GoodsData[good] == true) {
                            
                            msg += '[' + goodName + ']' + '有货,可以去兑换啦!\n'
                            await pushPlusNotify_aqc('爱妻查商城监控','[' + goodName + ']' + '有货了,快去兑换啦!')
                            await tgBotNotify_aqc('爱妻查商城监控','[' + goodName + ']' + '有货了,快去兑换啦!')
                        } else {
                            console.error(goodName + "无货,已跳过通知推送。")
                        }
                    }
                }

                console.log(msg)
                if (msg != '') {
                    msg += '\n\n兑换地址: https://qiye.baidu.com/usercenter/#/mall'
                    await notify.sendNotify($.name, msg, '');
                }
            } else {
                console.log("API请求错误" + res.data.msg)
            }
            resolve(res.data)
        } catch (err) {
            console.log(err)
        }
        resolve();
    });
}

function pushPlusNotify_aqc(text, desp) {

    return new Promise((resolve) => {
        if (PUSH_PLUS_TOKEN_AQC) {
            desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
            const body = {
                token: `${PUSH_PLUS_TOKEN_AQC}`,
                title: `${text}`,
                content: `${desp}`,
                topic: `${PUSH_PLUS_USER_AQC}`,
            };
            const options = {
                url: `https://www.pushplus.plus/send`,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': ' application/json',
                },
                timeout,
            };
            $.post(options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log(`push+发送${PUSH_PLUS_USER_AQC ? '一对多' : '一对一'}通知消息失败！！\n`);
                        console.log(err);
                    } else {
                        data = JSON.parse(data);
                        if (data.code === 200) {
                            console.log(`push+发送${PUSH_PLUS_USER_AQC ? '一对多' : '一对一'}通知消息完成。\n`);
                        } else {
                            console.log(`push+发送${PUSH_PLUS_USER_AQC ? '一对多' : '一对一'}通知消息失败：${data.msg}\n`);
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            });
        } else {
            resolve();
        }
    });
}

function tgBotNotify_aqc(text, desp) {
    return new Promise((resolve) => {
        if (TG_BOT_TOKEN_AQC && TG_USER_ID_AQC) {
            const options = {
                url: `https://api.telegram.org/bot${TG_BOT_TOKEN_AQC}/sendMessage`,
                body: `chat_id=${TG_USER_ID_AQC}&text=${text}\n\n${desp}&disable_web_page_preview=true`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout,
            };

            $.post(options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log('telegram发送通知消息失败！！\n');
                        console.log(err);
                    } else {
                        //console.log(data)
                        data = JSON.parse(data);
                        if (data.ok) {
                            console.log('Telegram发送通知消息成功🎉。\n');
                        } else if (data.error_code === 400) {
                            console.log('请主动给bot发送一条消息并检查接收用户ID是否正确。\n');
                        } else if (data.error_code === 401) {
                            console.log('Telegram bot token 填写错误。\n');
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            });
        } else {
            resolve();
        }
    });
}

if (aqcookie) {
    if (aqcookie.indexOf("@") != -1) {
        aqcookie.split("@").forEach((item) => {
            aqcookieArr.push(item);
        });
    } else {
        aqcookieArr.push(aqcookie);
    }

    if (aqcGoods.indexOf(",") != -1) {
        msg = '当前监控商品：\n'
        aqcGoods.split(",").forEach((item) => {
            msg += goodsDic[item] + '\n'
            aqcookieGoodsArr.push(item);
        });
        console.log(msg)
    } else {
        aqcookieGoodsArr.push(aqcGoods);
    }

    headers.cookie = aqcookieArr[0]
    checkEK();
} else {
    console.log("请手动抓取cookies");
    return;
}

// prettier-ignore
function Env (t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send (t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get (t) { return this.send.call(this.env, t) } post (t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode () { return "undefined" != typeof module && !!module.exports } isQuanX () { return "undefined" != typeof $task } isSurge () { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon () { return "undefined" != typeof $loon } toObj (t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr (t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson (t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson (t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript (t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript (t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata () { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata () { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get (t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set (t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata (t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata (t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval (t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval (t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv (t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get (t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post (t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time (t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg (e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log (...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr (t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait (t) { return new Promise(e => setTimeout(e, t)) } done (t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
