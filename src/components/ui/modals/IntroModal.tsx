/**
 * 开场叙事弹窗 - 像素风格
 */

interface IntroModalProps {
  onStart: () => void;
}

export function IntroModal({ onStart }: IntroModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal intro-modal">
        <div className="intro-content">
          <div className="intro-decorative">
            <span>☯</span>
          </div>

          <div className="intro-year">公元190年</div>
          <div className="intro-subtitle">汉室衰微，天下大乱</div>

          <p className="intro-text">
            董卓挟天子以令诸侯，占据洛阳、长安两大都城。关东诸侯会盟讨董，
            袁绍为盟主，曹操、刘备等群雄并起。乱世之中，英雄辈出， 谁能一统天下，重整河山？
          </p>

          <p className="intro-text">
            汝将扮演一方诸侯，通过内政发展、军事征伐，
            在这乱世之中开创属于自己的霸业。天命所归，唯有强者！
          </p>

          <div className="intro-decorative">
            <span>龙</span>
          </div>

          <button className="start-btn" onClick={onStart}>
            开始游戏
          </button>
        </div>
      </div>
    </div>
  );
}
