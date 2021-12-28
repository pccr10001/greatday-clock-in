# greatday-clock-in

### Description
* dashboard at `:3000/dash`
* clock in flow
    1. reschedule next day clock in at 8 PM
    2. schedule clock off when clock in

### Install
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
