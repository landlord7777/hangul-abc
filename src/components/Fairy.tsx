// 하트 요정 마스코트 그림 (장면별 자세)
export type Pose = 'welcome' | 'wave' | 'think' | 'cheer' | 'fight'

export default function Fairy({ pose, size, onClick }: { pose: Pose; size: number; onClick?: () => void }) {
  return (
    <img
      className="fairy"
      src={`${import.meta.env.BASE_URL}fairy/${pose}.png`}
      width={size}
      height={size}
      alt="하트 요정"
      draggable={false}
      onClick={onClick}
    />
  )
}
