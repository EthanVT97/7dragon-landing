export const quickResponses = {
  general: [
    {
      id: 'welcome',
      title: 'Welcome Message',
      content: 'Welcome to 18K Chat! How can I assist you today?'
    },
    {
      id: 'goodbye',
      title: 'Farewell',
      content: 'Thank you for chatting with us. Have a great day!'
    }
  ],
  deposit: [
    {
      id: 'deposit_methods',
      title: 'Deposit Methods',
      content: 'We accept various payment methods including bank transfer, e-wallets, and cryptocurrencies. Which method would you prefer?'
    },
    {
      id: 'min_deposit',
      title: 'Minimum Deposit',
      content: 'The minimum deposit amount is $10. Would you like assistance with making a deposit?'
    }
  ],
  withdrawal: [
    {
      id: 'withdrawal_process',
      title: 'Withdrawal Process',
      content: 'Withdrawals are processed within 24 hours. Please ensure your account is verified before requesting a withdrawal.'
    },
    {
      id: 'withdrawal_methods',
      title: 'Withdrawal Methods',
      content: 'You can withdraw using the same method used for deposit. Processing times vary by method.'
    }
  ],
  support: [
    {
      id: 'emergency',
      title: '🚨 Emergency Support',
      content: 'I understand this is an urgent matter. Let me connect you with our emergency support team right away.',
      isEmergency: true
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      content: 'I\'m sorry you\'re experiencing technical issues. Let\'s try these basic troubleshooting steps first:'
    }
  ],
  responsible: [
    {
      id: 'self_exclusion',
      title: 'Self-Exclusion',
      content: 'I can help you set up self-exclusion. This will restrict your account access for your chosen period. Would you like to proceed?',
      isEmergency: true
    },
    {
      id: 'limits',
      title: 'Set Limits',
      content: 'You can set daily, weekly, or monthly limits on your deposits. Would you like me to guide you through the process?'
    }
  ]
}
