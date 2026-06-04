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
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE SCREEN ──────────────────────────────────────────
function ProfileScreen({ phone, userName, setUserName, userStatus, setUserStatus, onClose, showNotif }) {
  const [editName, setEditName] = useState(userName || "طارق");
  const [editStatus, setEditStatus] = useState(userStatus);

  const save = () => {
    setUserName(editName);
    setUserStatus(editStatus);
    showNotif("تم حفظ الملف الشخصي ✓");
    onClose();
  };

  return (
    <div style={styles.profileScreen}>
      <div style={styles.profileHeader}>
        <button style={styles.backIconBtn} onClick={onClose}>→</button>
        <h2 style={styles.profileTitle}>الملف الشخصي</h2>
      </div>
      <div style={styles.profileAvatarSection}>
        <div style={styles.profileAvatar}>{editName[0] || "ط"}</div>
        <button style={styles.changePhotoBtn}>تغيير الصورة</button>
      </div>
      <div style={styles.profileForm}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>الاسم</label>
          <input
            style={styles.formInput}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="اسمك الكامل"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>الحالة</label>
          <input
            style={styles.formInput}
            value={editStatus}
            onChange={e => setEditStatus(e.target.value)}
            placeholder="اكتب حالتك..."
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>رقم الهاتف</label>
          <input style={{ ...styles.formInput, opacity: 0.6 }} value={phone || "+20 xxx xxx xxxx"} disabled dir="ltr" />
        </div>
        <button style={styles.saveBtn} onClick={save}>حفظ التغييرات</button>
      </div>
      <div style={styles.firebaseSection}>
        <h3 style={styles.firebaseTitle}>🔥 إعداد Firebase</h3>
        <p style={styles.firebaseNote}>
          لتفعيل الرسائل الحقيقية، أضف بيانات Firebase في أعلى الكود:
        </p>
        <div style={styles.codeBlock}>
          <code style={styles.code}>
            {`// 1. اذهب إلى console.firebase.google.com
// 2. أنشئ مشروعاً جديداً
// 3. فعّل Authentication > Phone
// 4. فعّل Realtime Database
// 5. فعّل Storage
// 6. انسخ إعدادات المشروع هنا`}
          </code>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICATION ────────────────────────────────────────────
function Notification({ msg, type }) {
  return (
    <div style={{
      ...styles.notification,
      background: type === "error" ? "#dc2626" : "#16a34a"
    }}>
      {msg}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const GREEN = "#25d366";
const DARK_GREEN = "#128c7e";
const BG = "#0a1628";
const SIDEBAR_BG = "#111b21";
const CHAT_BG = "#0d1b2a";
const BUBBLE_ME = "#1a3a2a";
const BUBBLE_THEM = "#1e2d3d";
const TEXT = "#e9edef";
const TEXT_SUB = "#8696a0";
const BORDER = "#1f2c34";

const styles = {
  // SPLASH
  splash: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)", fontFamily: "'Cairo', 'Tajawal', Arial, sans-serif", direction: "rtl" },
  splashInner: { textAlign: "center" },
  splashLogo: { fontSize: "72px", fontWeight: "900", color: GREEN, letterSpacing: "-2px", textShadow: `0 0 40px ${GREEN}66`, animation: "fadeIn 0.8s ease" },
  splashTagline: { fontSize: "18px", color: TEXT_SUB, marginTop: "8px", animation: "fadeIn 1s ease 0.3s both" },
  splashLoader: { display: "flex", gap: "8px", justifyContent: "center", marginTop: "40px" },
  loaderDot1: { width: "10px", height: "10px", borderRadius: "50%", background: GREEN, animation: "bounce 1.2s ease infinite" },
  loaderDot2: { width: "10px", height: "10px", borderRadius: "50%", background: GREEN, animation: "bounce 1.2s ease 0.2s infinite" },
  loaderDot3: { width: "10px", height: "10px", borderRadius: "50%", background: GREEN, animation: "bounce 1.2s ease 0.4s infinite" },

  // AUTH
  authScreen: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: BG, fontFamily: "'Cairo', 'Tajawal', Arial, sans-serif", direction: "rtl", padding: "20px" },
  authCard: { background: SIDEBAR_BG, borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "400px", border: `1px solid ${BORDER}`, position: "relative" },
  authLogo: { fontSize: "48px", fontWeight: "900", color: GREEN, textAlign: "center", marginBottom: "8px" },
  authSubtitle: { color: TEXT_SUB, textAlign: "center", fontSize: "15px", marginBottom: "24px" },
  phoneInput: { display: "flex", alignItems: "center", background: "#1f2c34", borderRadius: "12px", padding: "4px", marginBottom: "12px", border: `1px solid ${BORDER}` },
  flag: { padding: "12px", fontSize: "14px", color: TEXT, whiteSpace: "nowrap", borderLeft: `1px solid ${BORDER}` },
  phoneField: { flex: 1, background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: "16px", padding: "12px", direction: "ltr", fontFamily: "inherit" },
  authNote: { color: TEXT_SUB, fontSize: "13px", textAlign: "center", marginBottom: "24px" },
  primaryBtn: { width: "100%", padding: "16px", background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "'Cairo', Arial, sans-serif", letterSpacing: "0.5px" },
  authFooter: { color: TEXT_SUB, fontSize: "12px", textAlign: "center", marginTop: "16px" },
  link: { color: GREEN, cursor: "pointer" },
  backBtn: { position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: TEXT_SUB, cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
  phoneDisplay: { color: GREEN, textAlign: "center", fontWeight: "700", fontSize: "18px", marginBottom: "24px", direction: "ltr" },
  otpRow: { display: "flex", gap: "8px", justifyContent: "center", marginBottom: "24px", direction: "ltr" },
  otpBox: { width: "48px", height: "56px", background: "#1f2c34", border: `2px solid ${BORDER}`, borderRadius: "12px", color: TEXT, fontSize: "24px", fontWeight: "700", textAlign: "center", outline: "none", fontFamily: "inherit", MozAppearance: "textfield" },

  // MAIN APP
  app: { display: "flex", height: "100vh", background: BG, fontFamily: "'Cairo', 'Tajawal', Arial, sans-serif", direction: "rtl", overflow: "hidden" },

  // SIDEBAR
  sidebar: { width: "380px", minWidth: "380px", background: SIDEBAR_BG, display: "flex", flexDirection: "column", borderLeft: `1px solid ${BORDER}` },
  sidebarHeader: { display: "flex", alignItems: "center", padding: "12px 16px", gap: "12px", borderBottom: `1px solid ${BORDER}`, background: SIDEBAR_BG },
  myAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "16px", cursor: "pointer" },
  appName: { flex: 1, fontSize: "20px", fontWeight: "900", color: GREEN },
  headerIcons: { display: "flex", gap: "4px" },
  iconBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", padding: "6px", borderRadius: "8px", color: TEXT_SUB, transition: "background 0.2s" },

  // TABS
  tabs: { display: "flex", borderBottom: `1px solid ${BORDER}` },
  tab: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", background: "none", border: "none", cursor: "pointer", color: TEXT_SUB, fontSize: "11px", gap: "2px", position: "relative", transition: "color 0.2s" },
  tabActive: { color: GREEN, borderBottom: `2px solid ${GREEN}` },
  tabLabel: { fontSize: "11px" },
  tabBadge: { position: "absolute", top: "6px", right: "20px", background: GREEN, color: "#fff", borderRadius: "10px", fontSize: "10px", padding: "1px 5px", fontWeight: "700" },

  // SEARCH
  searchBox: { padding: "8px 12px", borderBottom: `1px solid ${BORDER}` },
  searchInput: { width: "100%", background: "#1f2c34", border: "none", borderRadius: "20px", padding: "8px 16px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },

  // CONTACTS
  sidebarContent: { flex: 1, overflowY: "auto", overflowX: "hidden" },
  contactItem: { display: "flex", alignItems: "center", padding: "12px 16px", gap: "12px", cursor: "pointer", borderBottom: `1px solid ${BORDER}11`, transition: "background 0.15s" },
  contactActive: { background: "#1f2c34" },
  contactAvatarWrap: { position: "relative", flexShrink: 0 },
  contactAvatar: { width: "50px", height: "50px", borderRadius: "50%", background: `linear-gradient(135deg, ${DARK_GREEN}, #0d6b5e)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "16px" },
  onlineDot: { position: "absolute", bottom: "2px", left: "2px", width: "12px", height: "12px", borderRadius: "50%", background: GREEN, border: `2px solid ${SIDEBAR_BG}` },
  contactInfo: { flex: 1, minWidth: 0 },
  contactTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  contactName: { fontWeight: "700", color: TEXT, fontSize: "15px" },
  contactTime: { fontSize: "12px", color: TEXT_SUB, flexShrink: 0 },
  contactBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  contactMsg: { fontSize: "13px", color: TEXT_SUB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  unreadBadge: { background: GREEN, color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0, marginRight: "4px" },

  // STORIES TAB
  storiesTab: { padding: "8px 0" },
  myStory: { display: "flex", alignItems: "center", padding: "12px 16px", gap: "14px", cursor: "pointer" },
  myStoryAvatar: { width: "50px", height: "50px", borderRadius: "50%", background: "#1f2c34", border: `2px dashed ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center" },
  myStoryPlus: { fontSize: "22px", color: GREEN, fontWeight: "300" },
  storyItem: { display: "flex", alignItems: "center", padding: "10px 16px", gap: "14px", cursor: "pointer" },
  storyRing: { width: "54px", height: "54px", borderRadius: "50%", border: "2.5px solid", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px" },
  storyAvatar: { width: "46px", height: "46px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "16px" },
  storyName: { fontWeight: "600", color: TEXT, fontSize: "14px" },
  storyTime: { fontSize: "12px", color: TEXT_SUB },
  storySeparator: { padding: "8px 16px", fontSize: "12px", color: TEXT_SUB, fontWeight: "600", background: "#0f1923", borderTop: `1px solid ${BORDER}` },

  // CALLS TAB
  callsTab: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" },
  callsEmpty: { fontSize: "32px", textAlign: "center" },
  callsNote: { color: TEXT_SUB, fontSize: "14px", marginTop: "8px" },

  // BOTTOM NAV
  bottomNav: { padding: "8px 12px", borderTop: `1px solid ${BORDER}` },
  navBtn: { width: "100%", background: "none", border: "none", color: TEXT_SUB, padding: "10px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", textAlign: "right" },
  navBtnActive: { background: "#1f2c34", color: GREEN },

  // CHAT AREA
  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  noChatSelected: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: CHAT_BG },
  noChat: { textAlign: "center", padding: "40px" },
  noChatIcon: { fontSize: "64px", fontWeight: "900", color: `${GREEN}44`, marginBottom: "16px" },
  noChatTitle: { fontSize: "28px", color: TEXT, fontWeight: "700", marginBottom: "8px" },
  noChatSub: { color: TEXT_SUB, fontSize: "16px", marginBottom: "32px" },
  noChatFeatures: { display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" },
  noChatFeature: { background: "#1f2c34", borderRadius: "20px", padding: "8px 16px", color: TEXT_SUB, fontSize: "13px" },

  // CHAT WINDOW
  chatWindow: { display: "flex", flexDirection: "column", height: "100%", background: CHAT_BG },
  chatHeader: { display: "flex", alignItems: "center", padding: "10px 16px", gap: "12px", background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}` },
  backIconBtn: { background: "none", border: "none", color: TEXT_SUB, cursor: "pointer", fontSize: "18px", padding: "4px 8px", transform: "scaleX(-1)" },
  chatHeaderAvatar: { width: "42px", height: "42px", borderRadius: "50%", background: `linear-gradient(135deg, ${DARK_GREEN}, #0d6b5e)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "15px" },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontWeight: "700", color: TEXT, fontSize: "16px" },
  chatHeaderStatus: { fontSize: "13px", color: TEXT_SUB },
  chatHeaderActions: { display: "flex", gap: "4px" },
  typingText: { color: GREEN },

  // MESSAGES
  messagesArea: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "4px",
    backgroundImage: `radial-gradient(circle at 20% 80%, #0d2137 0%, transparent 50%), radial-gradient(circle at 80% 20%, #071220 0%, transparent 50%)`,
  },
  dateDivider: { textAlign: "center", color: TEXT_SUB, fontSize: "12px", background: "#1f2c3488", borderRadius: "12px", padding: "4px 16px", alignSelf: "center", margin: "8px 0" },
  msgRow: { display: "flex", marginBottom: "2px" },
  msgBubble: { maxWidth: "65%", borderRadius: "12px", padding: "8px 12px", position: "relative" },
  msgMe: { background: BUBBLE_ME, borderBottomRight: "4px", borderBottomRightRadius: "4px" },
  msgThem: { background: BUBBLE_THEM, borderBottomLeft: "4px", borderBottomLeftRadius: "4px" },
  msgText: { color: TEXT, fontSize: "15px", lineHeight: "1.5", display: "block" },
  msgTime: { fontSize: "11px", color: TEXT_SUB, display: "block", textAlign: "left", marginTop: "2px", direction: "ltr" },
  typingDots: { display: "flex", gap: "4px", padding: "4px 0" },
  dot1: { animation: "bounce 1s ease infinite", color: TEXT_SUB },
  dot2: { animation: "bounce 1s ease 0.2s infinite", color: TEXT_SUB },
  dot3: { animation: "bounce 1s ease 0.4s infinite", color: TEXT_SUB },

  // INPUT
  inputArea: { display: "flex", alignItems: "center", padding: "10px 12px", gap: "8px", background: SIDEBAR_BG, borderTop: `1px solid ${BORDER}` },
  attachBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "4px" },
  msgInput: { flex: 1, background: "#1f2c34", border: "none", borderRadius: "24px", padding: "12px 18px", color: TEXT, fontSize: "15px", outline: "none", fontFamily: "'Cairo', Arial, sans-serif" },
  emojiBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "4px" },
  micBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "4px" },
  sendBtn: { width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  // PROFILE SCREEN
  profileScreen: { flex: 1, background: CHAT_BG, overflowY: "auto" },
  profileHeader: { display: "flex", alignItems: "center", padding: "16px 20px", gap: "12px", background: SIDEBAR_BG, borderBottom: `1px solid ${BORDER}` },
  profileTitle: { color: TEXT, fontSize: "18px", fontWeight: "700", margin: 0 },
  profileAvatarSection: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: "12px" },
  profileAvatar: { width: "100px", height: "100px", borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "900", fontSize: "40px" },
  changePhotoBtn: { background: "none", border: `1px solid ${GREEN}`, color: GREEN, borderRadius: "20px", padding: "6px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" },
  profileForm: { padding: "0 20px 20px" },
  formGroup: { marginBottom: "16px" },
  formLabel: { display: "block", color: GREEN, fontSize: "13px", marginBottom: "6px", fontWeight: "600" },
  formInput: { width: "100%", background: "#1f2c34", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 16px", color: TEXT, fontSize: "15px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  saveBtn: { width: "100%", padding: "16px", background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "8px" },

  // FIREBASE SECTION
  firebaseSection: { margin: "20px", background: "#1a1a2e", borderRadius: "16px", padding: "20px", border: "1px solid #ff6b0033" },
  firebaseTitle: { color: "#ff6b00", fontSize: "16px", fontWeight: "700", marginBottom: "8px", marginTop: 0 },
  firebaseNote: { color: TEXT_SUB, fontSize: "13px", marginBottom: "12px" },
  codeBlock: { background: "#0d0d1a", borderRadius: "10px", padding: "16px", overflow: "auto" },
  code: { color: "#7ee787", fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontFamily: "monospace" },

  // NOTIFICATION
  notification: { position: "fixed", top: "20px", right: "50%", transform: "translateX(50%)", color: "#fff", padding: "12px 24px", borderRadius: "24px", fontSize: "14px", fontWeight: "600", zIndex: 9999, boxShadow: "0 8px 24px #0006", animation: "slideDown 0.3s ease", fontFamily: "'Cairo', Arial, sans-serif" },
};

// ============================================================
// ANIMATIONS CSS
// ============================================================
const splashAnim = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; }
`;

const appAnim = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
  @keyframes slideDown { from { opacity: 0; transform: translateX(50%) translateY(-20px); } to { opacity: 1; transform: translateX(50%) translateY(0); } }
  * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: #1f2c34 transparent; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #1f2c34; border-radius: 4px; }
  body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; }
  button:hover { opacity: 0.85; }
`;
