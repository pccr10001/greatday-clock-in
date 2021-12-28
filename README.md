# greatday-clock-in

* initial a mongodb
* create db `agenda`
* create collection `users`
* sniff `username`, `password`, `npwd`, `ist` in login api `/auth/login` 
* create `User` object in `users` collection
``` json=
{
    "email" : "xxxx@xxx.com",
    "password" : "AAA",
    "npwd" : "BBB",
    "name" : "someone"
}
```
* `npm install`
* launch `index.js` `TZ=Asia/Taipei TG_TOKEN={TELEGRAM_BOT_TOKEN} TG_CH_ID={TELEGRAM_CHANNEL_ID} IST={IST} node index.js`