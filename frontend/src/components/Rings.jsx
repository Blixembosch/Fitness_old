import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import { homeRings } from '../lib/rings.js'

// Apple-Fitness-style progress rings for Home: training this week, protein today, calories today.
// Colours come from the app's tokens, so day/night follows the theme like everything else.
const C = 144 // ≈ 2πr for r = 23, the ring's full circumference

function Ring({ color, pct }) {
  const p = Math.max(0, Math.min(1, pct))
  return (
    <svg width="56" height="56" viewBox="0 0 58 58" aria-hidden="true" className="ring">
      <circle cx="29" cy="29" r="23" fill="none" stroke="var(--sep)" strokeWidth="6" />
      <circle cx="29" cy="29" r="23" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 29 29)" />
    </svg>
  )
}

export default function Rings({ S, today }) {
  const r = homeRings(S, today)
  const over = n => (n > 0 ? <small>/{fmtNum(n)}</small> : null)
  const deficit = r.calorie.deficit
  return (
    <div className="rings">
      <div className="ringcard">
        <Ring color="var(--blue)" pct={r.workout.pct} />
        <div><div className="v">{r.workout.done}{over(r.workout.target)}</div><div className="k">{t('Workouts')}</div></div>
      </div>
      <div className="ringcard">
        <Ring color="var(--orange)" pct={r.protein.pct} />
        <div><div className="v">{fmtNum(r.protein.done)}{over(r.protein.target)}<small> g</small></div><div className="k">{t('Protein')}</div></div>
      </div>
      <div className="ringcard">
        <Ring color="var(--green)" pct={r.calorie.pct} />
        <div>
          <div className="v">{fmtNum(r.calorie.done)}{over(r.calorie.target)}</div>
          <div className="k">{t('Calories')}{deficit != null ? ' · ' + (deficit > 0 ? '+' : '') + fmtNum(deficit) : ''}</div>
        </div>
      </div>
    </div>
  )
}
