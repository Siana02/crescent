import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'quiet' | 'light';

type ButtonProps = {
    children: ReactNode;
    href?: string;
    variant?: ButtonVariant;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    ariaLabel?: string;
    disabled?: boolean;
};

export default function Button({
    children,
    href,
    variant = 'primary',
    className = '',
    type = 'button',
    onClick,
    ariaLabel,
    disabled = false,
}: ButtonProps) {
    const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ');
    const label = (
        <span className="button__label">
            <span className="button__label-current">{children}</span>
            <span className="button__label-next" aria-hidden="true">{children}</span>
        </span>
    );

    if (href) {
        return (
            <a className={classes} href={href} onClick={onClick} aria-label={ariaLabel}>
                {label}
            </a>
        );
    }

    return (
        <button className={classes} type={type} onClick={onClick} aria-label={ariaLabel} disabled={disabled}>
            {label}
        </button>
    );
}
