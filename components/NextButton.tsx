'use client';

export function NextButton({ onClick, label = 'Next' }: { onClick: () => void; label?: string }) {
  return (
    <div className="mt-8 flex justify-end">
      <button className="btn btn-primary" onClick={onClick}>
        {label} →
      </button>
    </div>
  );
}
