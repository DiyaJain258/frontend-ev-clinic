import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { getWhatsAppLink } from '../utils/whatsapp';

interface WhatsAppButtonProps {
    phone: string | undefined | null;
    label?: string;
    variant?: 'icon' | 'button' | 'badge' | 'link';
    className?: string;
    size?: number;
    style?: React.CSSProperties;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    phone,
    label = 'WhatsApp',
    variant = 'button',
    className = '',
    size = 16,
    style = {}
}) => {
    const link = getWhatsAppLink(phone);
    const disabled = !phone || link === '#';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        window.open(link, '_blank', 'noopener,noreferrer');
    };

    if (variant === 'icon') {
        return (
            <button
                type="button"
                className={`whatsapp-icon-btn ${className}`}
                onClick={handleClick}
                disabled={disabled}
                title={disabled ? 'No phone number available' : `Contact via WhatsApp (${phone})`}
                style={{
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: `${size + 14}px`,
                    height: `${size + 14}px`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 5px rgba(37, 211, 102, 0.3)',
                    ...style
                }}
            >
                <FaWhatsapp size={size} />
            </button>
        );
    }

    if (variant === 'link') {
        return (
            <a
                href={disabled ? undefined : link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) e.preventDefault();
                }}
                className={`whatsapp-link ${className}`}
                style={{
                    color: disabled ? '#94a3b8' : '#25D366',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    ...style
                }}
                title={disabled ? 'No phone number available' : `Contact via WhatsApp (${phone})`}
            >
                <FaWhatsapp size={size} />
                {label && <span>{label}</span>}
            </a>
        );
    }

    return (
        <button
            type="button"
            className={`btn-whatsapp ${className}`}
            onClick={handleClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.4rem 0.8rem',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(37, 211, 102, 0.2)',
                transition: 'all 0.2s ease',
                ...style
            }}
            title={disabled ? 'No phone number available' : `Contact via WhatsApp (${phone})`}
        >
            <FaWhatsapp size={size} />
            {label && <span>{label}</span>}
        </button>
    );
};
