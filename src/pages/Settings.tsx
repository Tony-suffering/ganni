import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, Send, MessageSquare, FileText, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 通知設定機能は削除されました

  // モーダル状態
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // お問い合わせフォーム
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      // お問い合わせフォームにユーザー情報を事前入力
      setContactForm(prev => ({
        ...prev,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // 通知設定関連の関数は削除されました

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!contactForm.name.trim()) {
      errors.name = 'お名前を入力してください';
    } else if (contactForm.name.length < 2) {
      errors.name = 'お名前は2文字以上で入力してください';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactForm.email.trim()) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!emailRegex.test(contactForm.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!contactForm.subject) {
      errors.subject = '件名を選択してください';
    }
    
    if (!contactForm.message.trim()) {
      errors.message = 'メッセージを入力してください';
    } else if (contactForm.message.length < 10) {
      errors.message = 'メッセージは10文字以上で入力してください';
    } else if (contactForm.message.length > 1000) {
      errors.message = 'メッセージは1000文字以内で入力してください';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setContactLoading(true);

    try {
      // まずデータベースに保存
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          user_id: user?.id,
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message
        }]);

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('データベースエラー:', dbError);
      }

      // Edge Functionを呼び出してメール送信
      const { data, error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message
        }
      });

      if (emailError) {
        console.error('メール送信エラー:', emailError);
        // メール送信に失敗してもローカルに保存
        const contactLog = JSON.parse(localStorage.getItem('contact_messages') || '[]');
        contactLog.push({
          ...contactForm,
          user_id: user?.id,
          timestamp: new Date().toISOString(),
          emailSent: false
        });
        localStorage.setItem('contact_messages', JSON.stringify(contactLog));
        
        // ユーザーには成功として表示（お問い合わせは受け付けた）
        setContactSent(true);
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setFormErrors({});
        setTimeout(() => {
          setContactSent(false);
          setShowContact(false);
        }, 2000);
      } else {
        // 成功
        setContactSent(true);
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setFormErrors({});
        setTimeout(() => {
          setContactSent(false);
          setShowContact(false);
        }, 2000);
      }
    } catch (error) {
      console.error('予期しないエラー:', error);
      alert('お問い合わせの送信に失敗しました');
    } finally {
      setContactLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">設定を表示するにはログインが必要です</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-primary"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mt-16 md:mt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 md:top-20 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                設定
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* 通知設定セクションは削除されました */}

          {/* アプリについて */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                アプリについて
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">バージョン</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">アプリ名</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">AIコメンテーター</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    利用規約
                  </button>
                  <button 
                    onClick={() => setShowPrivacy(true)}
                    className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    プライバシーポリシー
                  </button>
                  <button 
                    onClick={() => setShowContact(true)}
                    className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    お問い合わせ
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 利用規約モーダル */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">利用規約</h3>
                <button onClick={() => setShowTerms(false)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                <h4 className="font-semibold">第1条（適用）</h4>
                <p>本利用規約（以下「本規約」）は、AIコメンテーター（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。</p>
                
                <h4 className="font-semibold">第2条（利用登録）</h4>
                <p>利用登録は、登録希望者が本規約に同意の上、所定の方法によって利用登録を申請し、当社がこれを承認することによって完了するものとします。</p>
                
                <h4 className="font-semibold">第3条（禁止事項）</h4>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：</p>
                <ul className="list-disc ml-6">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>他のユーザーまたは第三者の著作権等の知的財産権を侵害する行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                </ul>
                
                <h4 className="font-semibold">第4条（本サービスの提供の停止等）</h4>
                <p>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                
                <h4 className="font-semibold">第5条（免責事項）</h4>
                <p>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</p>
                
                <h4 className="font-semibold">第6条（規約の変更）</h4>
                <p>当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プライバシーポリシーモーダル */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">プライバシーポリシー</h3>
                <button onClick={() => setShowPrivacy(false)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4">
                <h4 className="font-semibold">1. 個人情報の定義</h4>
                <p>個人情報とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。</p>
                
                <h4 className="font-semibold">2. 個人情報の収集方法</h4>
                <p>当社は、ユーザーが利用登録をする際に氏名、メールアドレス等の個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先などから収集することがあります。</p>
                
                <h4 className="font-semibold">3. 個人情報を収集・利用する目的</h4>
                <p>当社が個人情報を収集・利用する目的は、以下のとおりです：</p>
                <ul className="list-disc ml-6">
                  <li>本サービスの提供・運営のため</li>
                  <li>ユーザーからのお問い合わせに回答するため</li>
                  <li>ユーザーが利用中のサービスの新機能、更新情報等の案内のため</li>
                  <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                  <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                </ul>
                
                <h4 className="font-semibold">4. 利用目的の変更</h4>
                <p>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</p>
                
                <h4 className="font-semibold">5. 個人情報の第三者提供</h4>
                <p>当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
                
                <h4 className="font-semibold">6. 個人情報の開示</h4>
                <p>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* お問い合わせモーダル */}
      {showContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">お問い合わせ</h3>
                <button onClick={() => setShowContact(false)} className="text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
              
              {contactSent ? (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-green-600 font-semibold">お問い合わせを送信しました</p>
                  <p className="text-sm text-gray-500 mt-2">ご連絡いただきありがとうございます。</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      お名前
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => {
                        setContactForm(prev => ({ ...prev, name: e.target.value }));
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => {
                        setContactForm(prev => ({ ...prev, email: e.target.value }));
                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      件名
                    </label>
                    <select
                      required
                      value={contactForm.subject}
                      onChange={(e) => {
                        setContactForm(prev => ({ ...prev, subject: e.target.value }));
                        if (formErrors.subject) setFormErrors(prev => ({ ...prev, subject: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        formErrors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">選択してください</option>
                      <option value="バグ報告">バグ報告</option>
                      <option value="機能要望">機能要望</option>
                      <option value="使い方について">使い方について</option>
                      <option value="その他">その他</option>
                    </select>
                    {formErrors.subject && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.subject}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      メッセージ
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => {
                        setContactForm(prev => ({ ...prev, message: e.target.value }));
                        if (formErrors.message) setFormErrors(prev => ({ ...prev, message: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        formErrors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="お問い合わせ内容をご記入ください"
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.message}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {contactForm.message.length}/1000文字
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowContact(false)}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{contactLoading ? '送信中...' : '送信'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 