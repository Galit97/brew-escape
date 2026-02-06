function Home() {
  return (
    <div className="page home home-coffee" dir="rtl">
      <div className="home-balloons">
        <span className="balloon balloon-1" />
        <span className="balloon balloon-2" />
        <span className="balloon balloon-3" />
        <span className="balloon balloon-4" />
        <span className="balloon balloon-5" />
        <span className="balloon balloon-6" />
      </div>
      <div className="home-finger-wrap">
        <img
          src="/game/assets/images/finger.png"
          alt="פינגר"
          className="home-finger"
        />
        <a href="/game/index.html" className="btn-start-game">
          התחל לשחק
        </a>
      </div>
      <h1 className="home-birthday-title">מזל טוב ליום הולדתך ה 30!</h1>
      <p className="home-signature">באהבה, גלית, קונוס ובונוס</p>
      <div className="home-characters">
        <img src="/game/assets/images/galit.png" alt="" className="home-char-img" />
        <img src="/game/assets/images/konus.png" alt="" className="home-char-img" />
        <img src="/game/assets/images/bonus.png" alt="" className="home-char-img" />
      </div>
    </div>
  )
}

export default Home
