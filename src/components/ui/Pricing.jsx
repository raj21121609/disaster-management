import React, { useState, useRef, useCallback } from 'react';
import { Check, Star, Zap, Shield, Users, Clock, Award } from 'lucide-react';
import { Switch } from './Switch';
import { Label } from './Label';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-media-query';
import './Pricing.css';

/**
 * Pricing plans configuration for CRISIS.ONE
 */
const PRICING_PLANS = [
    {
        id: 'community',
        name: 'Community',
        description: 'For individual volunteers and citizens',
        monthlyPrice: 0,
        yearlyPrice: 0,
        icon: Users,
        features: [
            'Report emergencies',
            'View live incident map',
            'Basic notifications',
            'Community alerts',
            'Mobile-friendly dashboard',
        ],
        cta: 'Get Started Free',
        popular: false,
    },
    {
        id: 'responder',
        name: 'Responder',
        description: 'For active volunteers and first responders',
        monthlyPrice: 29,
        yearlyPrice: 290,
        icon: Zap,
        features: [
            'Everything in Community',
            'Priority incident access',
            'Real-time GPS tracking',
            'Mission assignments',
            'Response analytics',
            'Team coordination tools',
        ],
        cta: 'Start Responding',
        popular: true,
    },
    {
        id: 'agency',
        name: 'Agency',
        description: 'For emergency management organizations',
        monthlyPrice: 199,
        yearlyPrice: 1990,
        icon: Shield,
        features: [
            'Everything in Responder',
            'Command center dashboard',
            'AI-powered predictions',
            'Resource management',
            'Multi-agency coordination',
            'Custom integrations',
            'Priority support',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

/**
 * Animated number display with smooth transitions
 */
function AnimatedNumber({ value, duration = 500 }) {
    const [displayValue, setDisplayValue] = useState(value);
    const animationRef = useRef(null);
    const previousValueRef = useRef(value);

    React.useEffect(() => {
        const startValue = previousValueRef.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;

            setDisplayValue(Math.round(currentValue));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValueRef.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return <span className="animated-number">{displayValue}</span>;
}

/**
 * Confetti effect for yearly plan selection
 */
function triggerConfetti(buttonRef) {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create confetti particles
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    const particles = [];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            pointer-events: none;
            z-index: 9999;
            left: ${x}px;
            top: ${y}px;
        `;
        document.body.appendChild(particle);
        particles.push(particle);

        // Animate particle
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const velocity = 100 + Math.random() * 150;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 100;

        let posX = x;
        let posY = y;
        let opacity = 1;
        let rotation = 0;

        const animateParticle = () => {
            posX += vx * 0.02;
            posY += vy * 0.02 + 2; // gravity
            opacity -= 0.02;
            rotation += 10;

            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            particle.style.opacity = opacity;
            particle.style.transform = `rotate(${rotation}deg)`;

            if (opacity > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        };

        requestAnimationFrame(animateParticle);
    }
}

/**
 * Individual pricing card component
 */
function PricingCard({ plan, isYearly, index }) {
    const isMobile = useIsMobile();
    const Icon = plan.icon;
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const period = isYearly ? '/year' : '/month';
    const savings = plan.monthlyPrice > 0
        ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
        : 0;

    return (
        <div
            className={cn(
                'pricing-card',
                plan.popular && 'pricing-card-popular',
            )}
            style={{
                animationDelay: `${index * 100}ms`,
            }}
        >
            {plan.popular && (
                <div className="pricing-badge">
                    <Star size={12} />
                    <span>Most Popular</span>
                </div>
            )}

            <div className="pricing-header">
                <div className="pricing-icon">
                    <Icon size={24} />
                </div>
                <h3 className="pricing-name">{plan.name}</h3>
                <p className="pricing-description">{plan.description}</p>
            </div>

            <div className="pricing-price">
                <span className="pricing-currency">$</span>
                <AnimatedNumber value={price} />
                <span className="pricing-period">{period}</span>
            </div>

            {isYearly && savings > 0 && (
                <div className="pricing-savings">
                    <Award size={14} />
                    <span>Save {savings}% with yearly billing</span>
                </div>
            )}

            <ul className="pricing-features">
                {plan.features.map((feature, i) => (
                    <li key={i} className="pricing-feature">
                        <Check size={16} className="pricing-check" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                className={cn(
                    'pricing-cta',
                    plan.popular && 'pricing-cta-primary',
                )}
            >
                {plan.cta}
            </button>
        </div>
    );
}

/**
 * Main Pricing component
 * Features animated cards, monthly/yearly toggle with confetti, responsive design
 */
export function Pricing({ className }) {
    const [isYearly, setIsYearly] = useState(false);
    const toggleRef = useRef(null);

    const handleToggle = useCallback((checked) => {
        setIsYearly(checked);
        if (checked) {
            triggerConfetti(toggleRef);
        }
    }, []);

    return (
        <section className={cn('pricing-section', className)}>
            <div className="pricing-container">
                <div className="pricing-header-section">
                    <h2 className="pricing-title">
                        Choose Your <span className="text-emergency">Response</span> Plan
                    </h2>
                    <p className="pricing-subtitle">
                        Join thousands of responders saving lives with CRISIS.ONE
                    </p>

                    <div className="pricing-toggle" ref={toggleRef}>
                        <Label
                            htmlFor="billing-toggle"
                            className={cn(!isYearly && 'label-active')}
                        >
                            Monthly
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={isYearly}
                            onCheckedChange={handleToggle}
                        />
                        <Label
                            htmlFor="billing-toggle"
                            className={cn(isYearly && 'label-active')}
                        >
                            Yearly
                            <span className="pricing-discount-badge">Save 20%</span>
                        </Label>
                    </div>
                </div>

                <div className="pricing-grid">
                    {PRICING_PLANS.map((plan, index) => (
                        <PricingCard
                            key={plan.id}
                            plan={plan}
                            isYearly={isYearly}
                            index={index}
                        />
                    ))}
                </div>

                <div className="pricing-footer">
                    <p className="pricing-guarantee">
                        <Shield size={16} />
                        <span>30-day money-back guarantee • Cancel anytime</span>
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Pricing;
