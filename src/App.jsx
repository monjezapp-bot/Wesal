import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// FIREBASE CONFIG - المستخدم يضع بياناته هنا
// ============================================================
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com"
};

// ============================================================
// MOCK DATA للتجربة بدون Firebase
// ============================================================
const MOCK_CONTACTS = [
  { id: "1", name: "أحمد محمد", phone: "+201001234567", avatar: "أح", status: "متاح", lastSeen: "الآن", lastMsg: "كيف حالك يا صديقي؟", time: "10:30", unread: 2, online: true },
  { id: "2", name: "فاطمة علي", phone: "+201112345678", avatar: "فا", status: "في اجتماع", lastSeen: "منذ ساعة", lastMsg: "شكراً جزيلاً 🙏", time: "09:15", unread: 0, online: false },
  { id: "3", name: "محمد العربي", phone: "+966501234567", avatar: "مح", status: "مشغول", lastSeen: "منذ 3 ساعات", lastMsg: "سنتحدث لاحقاً", time: "أمس", unread: 5, online: false },
  { id: "4", name: "سارة خالد", phone: "+971501234567", avatar: "سا", status: "✈️ في سفر", lastSeen: "منذ يومين", lastMsg: "صورة جميلة جداً! 😍", time: "أمس", unread: 0, online: false },
  { id: "5", name: "عمر حسين", phone: "+966551234567", avatar: "عم", status: "أحب البرمجة 💻", lastSeen: "منذ 30 دقيقة", lastMsg: "الكود شغال تمام", time: "12:00", unread: 1, online: true },
];

const MOCK_MESSAGES = {
  "1": [
    { id: "m1", from: "them", text: "السلام عليكم يا طارق! 👋", time: "10:20", type: "text" },
    { id: "m2", from: "me", text: "وعليكم السلام يا أحمد! كيف حالك؟", time: "10:22", type: "text" },
    { id: "m3", from: "them", text: "الحمد لله بخير! إيه أخبار المشاريع؟", time: "10:25", type: "text" },
    { id: "m4", from: "me", text: "بنبني تطبيق شات عربي جديد 🔥", time: "10:27", type: "text" },
    { id: "m5", from: "them", text: "كيف حالك يا صديقي؟", time: "10:30", type: "text" },
  ],
  "2": [
    { id: "m1", from: "them", text: "صباح الخير يا طارق 🌸", time: "09:00", type: "text" },
    { id: "m2", from: "me", text: "صباح النور فاطمة! كل سنة وأنتِ بخير", time: "09:10", type: "text" },
    { id: "m3", from: "them", text: "شكراً جزيلاً 🙏", time: "09:15", type: "text" },
  ],
  "3": [
    { id: "m1", from: "me", text: "متى نلتقي؟", time: "أمس", type: "text" },
    { id: "m2", from: "them", text: "سنتحدث لاحقاً", time: "أمس", type: "text" },
  ],
  "4": [
    { id: "m1", from: "them", text: "صورة جميلة جداً! 😍", time: "أمس", type: "text" },
  ],
  "5": [
    { id: "m1", from: "them", text: "شفت الكود الجديد؟", time: "11:55", type: "text" },
    { id: "m2", from: "me", text: "أيوه! الكود شغال تمام", time: "12:00", type: "text" },
    { id: "m3", from: "them", text: "الكود شغال تمام", time: "12:00", type: "text" },
  ],
};

const MOCK_STORIES = [
  { id: "s1", user: "أحمد", avatar: "أح", color: "#16a34a", seen: false, time: "منذ ساعة" },
  { id: "s2", user: "فاطمة", avatar: "فا", color: "#ea580c", seen: false, time: "منذ ساعتين" },
  { id: "s3", user: "محمد", avatar: "مح", color: "#0891b2", seen: true, time: "منذ 5 ساعات" },
  { id: "s4", user: "سارة", avatar: "سا", color: "#7c3aed", seen: true, time: "منذ يوم" },
];

// ============================================================
// MAIN APP
// ============================================================
export default function ArabChatApp() {
  const [screen, setScreen] = useState("splash"); // splash | login | otp | app
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [userName, setUserName] = useState("");
  const [userStatus, setUserStatus] = useState("متاح للتحدث 👋");
  const [activeTab, setActiveTab] = useState("chats"); // chats | stories | calls | settings
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMsg, setInputMsg] = useState("");
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    setMessages(MOCK_MESSAGES);
    const timer = setTimeout(() => setScreen("login"), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleLogin = () => {
    if (phone.length < 10) { showNotif("أدخل رقم هاتف صحيح", "error"); return; }
    setScreen("otp");
    showNotif("تم إرسال رمز التحقق ✓");
  };

  const handleOtpVerify = () => {
    const code = otp.join("");
    if (code.length < 6) { showNotif("أدخل الرمز كاملاً", "error"); return; }
    // In real app: verify with Firebase Auth
    setScreen("app");
    showNotif("مرحباً بك في وصال! 🎉");
  };

  const sendMessage = () => {
    if (!inputMsg.trim() || !activeChat) return;
    const newMsg = {
      id: `m${Date.now()}`,
      from: "me",
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
      type: "text",
      status: "sent"
    };
    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));
    setContacts(prev => prev.map(c =>
      c.id === activeChat.id ? { ...c, lastMsg: inputMsg.trim(), time: "الآن" } : c
    ));
    setInputMsg("");

    // Simulate reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replies = ["👍", "حسناً، فهمت!", "جميل جداً", "شكراً لك 😊", "سأرد عليك قريباً", "تمام تمام 🔥"];
      const reply = {
        id: `m${Date.now() + 1}`,
        from: "them",
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
        type: "text"
      };
      setMessages(prev => ({
        ...prev,
        [activeChat.id]: [...(prev[activeChat.id] || []), reply]
      }));
    }, 1500 + Math.random() * 1000);
  };

  const filteredContacts = contacts.filter(c =>
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  // ── SPLASH SCREEN ──────────────────────────────────────────
  if (screen === "splash") return (
    <div style={styles.splash}>
      <div style={styles.splashInner}>
        <div style={styles.splashLogo}>وصال</div>
        <div style={styles.splashTagline}>تواصل بلا حدود</div>
        <div style={styles.splashLoader}>
          <div style={styles.loaderDot1} />
          <div style={styles.loaderDot2} />
          <div style={styles.loaderDot3} />
        </div>
      </div>
      <style>{splashAnim}</style>
    </div>
  );

  // ── LOGIN SCREEN ───────────────────────────────────────────
  if (screen === "login") return (
    <div style={styles.authScreen}>
      {notification && <Notification {...notification} />}
      <div style={styles.authCard}>
        <div style={styles.authLogo}>وصال</div>
        <p style={styles.authSubtitle}>أدخل رقم هاتفك للمتابعة</p>
        <div style={styles.phoneInput}>
          <span style={styles.flag}>🇪🇬 +20</span>
          <input
            style={styles.phoneField}
            type="tel"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            dir="ltr"
          />
        </div>
        <p style={styles.authNote}>سنرسل رمز تحقق إلى هذا الرقم</p>
        <button style={styles.primaryBtn} onClick={handleLogin}>
          متابعة ←
        </button>
        <p style={styles.authFooter}>بالمتابعة أنت توافق على <span style={styles.link}>شروط الاستخدام</span></p>
      </div>
    </div>
  );

  // ── OTP SCREEN ─────────────────────────────────────────────
  if (screen === "otp") return (
    <div style={styles.authScreen}>
      {notification && <Notification {...notification} />}
      <div style={styles.authCard}>
        <button style={styles.backBtn} onClick={() => setScreen("login")}>→ رجوع</button>
        <div style={styles.authLogo}>وصال</div>
        <p style={styles.authSubtitle}>أدخل رمز التحقق المرسل إلى</p>
        <p style={styles.phoneDisplay}>{phone}</p>
        <div style={styles.otpRow}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => otpRefs.current[i] = el}
              style={styles.otpBox}
              type="number"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              dir="ltr"
            />
          ))}
        </div>
        <button style={styles.primaryBtn} onClick={handleOtpVerify}>تحقق من الرمز</button>
        <p style={styles.authNote}>لم تستلم الرمز؟ <span style={styles.link}>إعادة الإرسال</span></p>
      </div>
    </div>
  );

  // ── MAIN APP ───────────────────────────────────────────────
  const currentMsgs = activeChat ? (messages[activeChat.id] || []) : [];

  return (
    <div style={styles.app}>
      {notification && <Notification {...notification} />}
      <style>{appAnim}</style>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.myAvatar} onClick={() => setShowProfile(true)}>
            {userName ? userName[0] : "ط"}
          </div>
          <span style={styles.appName}>وصال</span>
          <div style={styles.headerIcons}>
            <button style={styles.iconBtn} title="بحث">🔍</button>
            <button style={styles.iconBtn} title="قائمة">⋮</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { id: "chats", label: "المحادثات", icon: "💬" },
            { id: "stories", label: "الحالات", icon: "⭕" },
            { id: "calls", label: "المكالمات", icon: "📞" },
          ].map(tab => (
            <button
              key={tab.id}
              style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
              {tab.id === "chats" && contacts.reduce((a, c) => a + c.unread, 0) > 0 && (
                <span style={styles.tabBadge}>{contacts.reduce((a, c) => a + c.unread, 0)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab === "chats" && (
          <div style={styles.searchBox}>
            <input
              style={styles.searchInput}
              placeholder="🔍 بحث في المحادثات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Content */}
        <div style={styles.sidebarContent}>
          {activeTab === "chats" && (
            <div>
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  style={{
                    ...styles.contactItem,
                    ...(activeChat?.id === contact.id ? styles.contactActive : {})
                  }}
                  onClick={() => {
                    setActiveChat(contact);
                    setContacts(prev => prev.map(c =>
                      c.id === contact.id ? { ...c, unread: 0 } : c
                    ));
                  }}
                >
                  <div style={styles.contactAvatarWrap}>
                    <div style={styles.contactAvatar}>{contact.avatar}</div>
                    {contact.online && <div style={styles.onlineDot} />}
                  </div>
                  <div style={styles.contactInfo}>
                    <div style={styles.contactTop}>
                      <span style={styles.contactName}>{contact.name}</span>
                      <span style={styles.contactTime}>{contact.time}</span>
                    </div>
                    <div style={styles.contactBottom}>
                      <span style={styles.contactMsg}>{contact.lastMsg}</span>
                      {contact.unread > 0 && (
                        <span style={styles.unreadBadge}>{contact.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "stories" && (
            <div style={styles.storiesTab}>
              <div style={styles.myStory}>
                <div style={styles.myStoryAvatar}>
                  <span style={styles.myStoryPlus}>+</span>
                </div>
                <div>
                  <div style={styles.storyName}>حالتي</div>
                  <div style={styles.storyTime}>أضف حالة جديدة</div>
                </div>
              </div>
              <div style={styles.storySeparator}>المشاهدة غير المكتملة</div>
              {MOCK_STORIES.filter(s => !s.seen).map(story => (
                <div key={story.id} style={styles.storyItem}>
                  <div style={{ ...styles.storyRing, borderColor: story.color }}>
                    <div style={{ ...styles.storyAvatar, background: story.color }}>{story.avatar}</div>
                  </div>
                  <div>
                    <div style={styles.storyName}>{story.user}</div>
                    <div style={styles.storyTime}>{story.time}</div>
                  </div>
                </div>
              ))}
              <div style={styles.storySeparator}>المشاهدة المكتملة</div>
              {MOCK_STORIES.filter(s => s.seen).map(story => (
                <div key={story.id} style={styles.storyItem}>
                  <div style={{ ...styles.storyRing, borderColor: "#555" }}>
                    <div style={{ ...styles.storyAvatar, background: "#555" }}>{story.avatar}</div>
                  </div>
                  <div>
                    <div style={styles.storyName}>{story.user}</div>
                    <div style={styles.storyTime}>{story.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "calls" && (
            <div style={styles.callsTab}>
              <p style={styles.callsEmpty}>📞 لا توجد مكالمات حديثة</p>
              <p style={styles.callsNote}>مكالمات الصوت والفيديو قادمة قريباً</p>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={styles.bottomNav}>
          <button
            style={{ ...styles.navBtn, ...(activeTab === "settings" ? styles.navBtnActive : {}) }}
            onClick={() => { setActiveTab("settings"); setActiveChat(null); setShowProfile(true); }}
          >⚙️ الإعدادات</button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>
        {!activeChat && !showProfile ? (
          <div style={styles.noChatSelected}>
            <div style={styles.noChat}>
              <div style={styles.noChatIcon}>وصال</div>
              <h2 style={styles.noChatTitle}>مرحباً بك في وصال</h2>
              <p style={styles.noChatSub}>اختر محادثة من القائمة للبدء</p>
              <div style={styles.noChatFeatures}>
                <div style={styles.noChatFeature}>🔒 تشفير من طرف لطرف</div>
                <div style={styles.noChatFeature}>⚡ رسائل فورية</div>
                <div style={styles.noChatFeature}>🌍 تواصل مع العالم العربي</div>
              </div>
            </div>
          </div>
        ) : showProfile ? (
          <ProfileScreen
            phone={phone}
            userName={userName}
            setUserName={setUserName}
            userStatus={userStatus}
            setUserStatus={setUserStatus}
            onClose={() => setShowProfile(false)}
            showNotif={showNotif}
          />
        ) : (
          <div style={styles.chatWindow}>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <button style={styles.backIconBtn} onClick={() => setActiveChat(null)}>→</button>
              <div style={styles.chatHeaderAvatar}>{activeChat.avatar}</div>
              <div style={styles.chatHeaderInfo}>
                <div style={styles.chatHeaderName}>{activeChat.name}</div>
                <div style={styles.chatHeaderStatus}>
                  {isTyping ? <span style={styles.typingText}>يكتب...</span> : (
                    activeChat.online ? "متصل الآن 🟢" : `آخر ظهور: ${activeChat.lastSeen}`
                  )}
                </div>
              </div>
              <div style={styles.chatHeaderActions}>
                <button style={styles.iconBtn} title="مكالمة صوتية">📞</button>
                <button style={styles.iconBtn} title="مكالمة فيديو">📹</button>
                <button style={styles.iconBtn} title="قائمة">⋮</button>
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              <div style={styles.dateDivider}>اليوم</div>
              {currentMsgs.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    ...styles.msgRow,
                    justifyContent: msg.from === "me" ? "flex-start" : "flex-end"
                  }}
                >
                  <div style={{
                    ...styles.msgBubble,
                    ...(msg.from === "me" ? styles.msgMe : styles.msgThem)
                  }}>
                    <span style={styles.msgText}>{msg.text}</span>
                    <span style={styles.msgTime}>
                      {msg.time}
                      {msg.from === "me" && " ✓✓"}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div style={{ ...styles.msgRow, justifyContent: "flex-end" }}>
                  <div style={{ ...styles.msgBubble, ...styles.msgThem }}>
                    <div style={styles.typingDots}>
                      <span style={styles.dot1}>•</span>
                      <span style={styles.dot2}>•</span>
                      <span style={styles.dot3}>•</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputArea}>
              <button style={styles.attachBtn} title="مرفقات">📎</button>
              <input
                style={styles.msgInput}
                placeholder="اكتب رسالة..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button style={styles.emojiBtn} title="رموز تعبيرية">😊</button>
              <button style={styles.micBtn} title="رسالة صوتية">🎙️</button>
              <button
                style={{ ...styles.sendBtn, opacity: inputMsg.trim() ? 1 : 0.5 }}
                onClick={sendMessage}
                disabled={!inputMsg.trim()}
              >
                ←
         
