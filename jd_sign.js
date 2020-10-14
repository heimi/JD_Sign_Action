// version v0.0.1
// create by zhihua
// detail url: https://github.com/ruicky/jd_sign_bot

const exec = require('child_process').execSync
const fs = require('fs')
const rp = require('request-promise')
const download = require('download')

// 京东Cookie
const cookie = 'shshshfpa=6ab89bd4-d85d-47d5-f27d-7a46b911bba6-1545266167; shshshfpb=rEV6zqcg5zMN8X2%2F%2FzsA8dw%3D%3D; pinId=1IYdQ1Ncm51LiJzBRXVLdrV9-x-f3wj7; __jdu=15440778634511762287188; __jdv=76161171|direct|-|none|-|1602671902146; areaId=20; ipLoc-djd=20-1818-1820-0; PCSYCityID=CN_450000_451200_451203; shshshfp=75710414305c8a032b782b97cb6a99f7; TrackID=1aHkP0MddiAbU70b13Q8DDOwyUAP0jG6INCrSlYE2nVdnj0m-o7qxXG2YSrozU1yaZDeLf1E13765K1FpZCm5A-Jbi3nwLYE-ZeO7vIJLir0; thor=78111811081570A3204C265086AB804027F064E3B1068F06154FBB066EDA660FEBC918E8B6757046BFD54C958F13D94F12FC2CF76637DEAF31BB14926CE4D14F441E2FCA1AEBF777BE8EB8AC6912045F3257E70E6870BDEEBDCDB5C97D215C3412F77099E12FBE0EA43AFBD1E07044B8D49B740767E46C0D154C075C9575059814AD1074895CAAFA5AC70395AB7A74BFCC4A3AE523A541C4B78B50523F28B096; pin=4986400-16627629; unick=_%E9%BB%91%E7%B1%B3_; ceshi3.com=201; _tp=8FAyrsk7ftTMlzVVBJAJlVat2Ku5tmhpXSanCw%2FSXi4%3D; _pst=4986400-16627629; shshshsID=24babadfa4b77ab915bb450ae8d63169_2_1602671926939; __jda=122270672.15440778634511762287188.1544077863.1600825611.1602671902.49; __jdb=122270672.5.15440778634511762287188|49.1602671902; __jdc=122270672; 3AB9D23F7A4B3C9B=REQBBWH5H2ZDIDCJBTAP3RC4GED4CWPYACGLX3W4MX4VOCYICBVOOLRJ45ISFSS7LGQMTSE2NYX267WARDEWA2YHTU'
// 京东Cookie
const dual_cookie = ''
// Server酱SCKEY
const push_key = 'SCU36210Ta45f3a9620da2aaf644f867848749f465bf659aa30957'

// 京东脚本文件
const js_url = 'https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js'
// 下载脚本路劲
const js_path = './JD_DailyBonus.js'
// 脚本执行输出路劲
const result_path = './result.txt'
// 错误信息输出路劲
const error_path = './error.txt'

Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

function dateFormat() {
  var timezone = 8;
  var GMT_offset = new Date().getTimezoneOffset();
  var n_Date = new Date().getTime();
  var t_Date = new Date(n_Date + GMT_offset * 60 * 1000 + timezone * 60 * 60 * 1000);
  console.log(t_Date)
  return t_Date.Format('yyyy.MM.dd')
}

function setupCookie() {
  var js_content = fs.readFileSync(js_path, 'utf8')
  js_content = js_content.replace(/var Key = ''/, `var Key = '${cookie}'`)
  if (dual_cookie) {
    js_content = js_content.replace(/var DualKey = ''/, `var DualKey = '${dual_cookie}'`)
  }
  fs.writeFileSync(js_path, js_content, 'utf8')
}

function sendNotificationIfNeed() {

  if (!push_key) {
    console.log('执行任务结束!'); return;
  }

  if (!fs.existsSync(result_path)) {
    console.log('没有执行结果，任务中断!'); return;
  }

  let text = "京东签到_" + dateFormat();
  let desp = fs.readFileSync(result_path, "utf8")

  // 去除末尾的换行
  let SCKEY = push_key.replace(/[\r\n]/g,"")

  const options ={
    uri:  `https://sc.ftqq.com/${SCKEY}.send`,
    form: { text, desp },
    json: true,
    method: 'POST'
  }

  rp.post(options).then(res=>{
    const code = res['errno'];
    if (code == 0) {
      console.log("通知发送成功，任务结束！")
    }
    else {
      console.log(res);
      console.log("通知发送失败，任务中断！")
      fs.writeFileSync(error_path, JSON.stringify(res), 'utf8')
    }
  }).catch((err)=>{
    console.log("通知发送失败，任务中断！")
    fs.writeFileSync(error_path, err, 'utf8')
  })
}

function main() {

  if (!cookie) {
    console.log('请配置京东cookie!'); return;
  }

  // 1、下载脚本
  download(js_url, './').then(res=>{
    // 2、替换cookie
    setupCookie()
    // 3、执行脚本
    exec(`node '${js_path}' >> '${result_path}'`);
    // 4、发送推送
    sendNotificationIfNeed() 
  }).catch((err)=>{
    console.log('脚本文件下载失败，任务中断！');
    fs.writeFileSync(error_path, err, 'utf8')
  })

}

main()