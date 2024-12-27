import { createI18n } from 'vue-i18n'

const messages = {
  my: {
    nav: {
      home: 'ပင်မ',
      pricing: 'စျေးနှုန်းများ',
      about: 'အကြောင်း',
      login: 'လော့ဂ်အင်'
    },
    home: {
      title: '၁၈ကရက် ချက် - ခေတ်မီသော ဝန်ဆောင်မှုစနစ်',
      subtitle: 'သင့်စီးပွားရေးအတွက် အကောင်းဆုံး ဆက်သွယ်ရေးနည်းလမ်း',
      startNow: 'စတင်မည်',
      learnMore: 'ပိုမိုလေ့လာရန်'
    },
    pricing: {
      title: 'စျေးနှုန်းများ',
      basic: {
        title: 'အခြေခံ',
        price: '၅၀,၀၀၀ ကျပ်/လ',
        features: [
          'တစ်ပြိုင်နက် ဝန်ထမ်း ၃ ယောက်',
          'စကားဝှက် ၁၀၀၀',
          'အခြေခံ အစီရင်ခံစာများ'
        ]
      },
      pro: {
        title: 'ပရို',
        price: '၁၅၀,၀၀၀ ကျပ်/လ',
        features: [
          'တစ်ပြိုင်နက် ဝန်ထမ်း ၁၀ ယောက်',
          'စကားဝှက် အကန့်အသတ်မရှိ',
          'အဆင့်မြင့် အစီရင်ခံစာများ',
          'ဘာသာစကား အားလုံး'
        ]
      }
    },
    chat: {
      placeholder: 'စာရိုက်ရန်...',
      send: 'ပို့မည်',
      connecting: 'ချိတ်ဆက်နေသည်...',
      offline: 'အင်တာနက်မရှိပါ'
    },
    admin: {
      dashboard: 'ထိန်းချုပ်ခန်း',
      users: 'သုံးစွဲသူများ',
      messages: 'စာများ',
      settings: 'ဆက်တင်များ'
    }
  },
  th: {
    nav: {
      home: 'หน้าแรก',
      pricing: 'ราคา',
      about: 'เกี่ยวกับเรา',
      login: 'เข้าสู่ระบบ'
    },
    home: {
      title: '18K Chat - แพลตฟอร์มบริการลูกค้าสมัยใหม่',
      subtitle: 'วิธีการสื่อสารที่ดีที่สุดสำหรับธุรกิจของคุณ',
      startNow: 'เริ่มต้นใช้งาน',
      learnMore: 'เรียนรู้เพิ่มเติม'
    },
    pricing: {
      title: 'ราคา',
      basic: {
        title: 'พื้นฐาน',
        price: '฿1,500/เดือน',
        features: [
          'แชทพร้อมกัน 5 ราย',
          'ฟีเจอร์บอทพื้นฐาน',
          'การสนับสนุน 24/7'
        ]
      },
      pro: {
        title: 'โปร',
        price: '฿4,500/เดือน',
        features: [
          'แชทพร้อมกันไม่จำกัด',
          'ฟีเจอร์บอทขั้นสูง',
          'การสนับสนุนระดับพรีเมียม'
        ]
      }
    },
    chat: {
      placeholder: 'พิมพ์ข้อความ...',
      send: 'ส่ง',
      connecting: 'กำลังเชื่อมต่อ...',
      welcome: 'สวัสดี! เราจะช่วยคุณได้อย่างไร?'
    }
  },
  en: {
    nav: {
      home: 'Home',
      pricing: 'Pricing',
      about: 'About',
      login: 'Login'
    },
    home: {
      title: '18K Chat - Modern Customer Service Platform',
      subtitle: 'The best way to communicate with your customers',
      startNow: 'Start Now',
      learnMore: 'Learn More'
    },
    pricing: {
      title: 'Pricing',
      basic: {
        title: 'Basic',
        price: '$49/month',
        features: [
          '5 Concurrent Chats',
          'Basic Bot Features',
          '24/7 Support'
        ]
      },
      pro: {
        title: 'Pro',
        price: '$149/month',
        features: [
          'Unlimited Concurrent Chats',
          'Advanced Bot Features',
          'Priority Support'
        ]
      }
    },
    chat: {
      placeholder: 'Type a message...',
      send: 'Send',
      connecting: 'Connecting...',
      welcome: 'Hello! How can we help you today?'
    }
  }
}

export default createI18n({
  legacy: false,
  locale: 'my', 
  fallbackLocale: 'my',
  messages
})
