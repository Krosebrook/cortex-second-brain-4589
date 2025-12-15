import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  showTestimonials: boolean;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "A game-changer in how I manage my projects!",
    name: "Sarah P.",
    role: "Product Manager",
    rating: 5
  },
  {
    quote: "The AI integrations have saved me countless hours.",
    name: "James L.",
    role: "Software Developer",
    rating: 5
  },
  {
    quote: "I finally have a way to organize my ideas and execute them seamlessly.",
    name: "Amanda T.",
    role: "Content Creator",
    rating: 4
  },
  {
    quote: "The template library is a lifesaver for my research and presentations.",
    name: "Dr. Michael R.",
    role: "Researcher",
    rating: 5
  },
  {
    quote: "I can collaborate with my team like never before. It's so intuitive!",
    name: "Emma A.",
    role: "Marketing Lead",
    rating: 4
  },
  {
    quote: "The search function is incredible. I can find anything in seconds.",
    name: "Laura M.",
    role: "Data Analyst",
    rating: 5
  },
  {
    quote: "It's like having an AI-powered assistant that works exactly the way I want.",
    name: "Rafael O.",
    role: "Startup Founder",
    rating: 5
  },
  {
    quote: "The visualization tools have transformed how I present complex data.",
    name: "David K.",
    role: "Data Scientist",
    rating: 4
  },
  {
    quote: "I've never been more organized. Everything is just a click away.",
    name: "Nicole F.",
    role: "Executive Assistant",
    rating: 5
  },
  {
    quote: "The AI recommendations are surprisingly accurate and helpful.",
    name: "Thomas J.",
    role: "Researcher",
    rating: 4
  },
  {
    quote: "My productivity has doubled since I started using this platform.",
    name: "Sophia R.",
    role: "Project Manager",
    rating: 5
  },
  {
    quote: "The integration with other tools makes my workflow seamless.",
    name: "Alex C.",
    role: "Product Designer",
    rating: 5
  }
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1 mb-2">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={cn(
          "transition-colors duration-200",
          i < rating
            ? "text-amber-400 fill-amber-400"
            : "text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

export const TestimonialsSection = ({ showTestimonials }: TestimonialsSectionProps) => {
  return (
    <AnimatedTransition show={showTestimonials} animation="slide-up" duration={600}>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent md:text-8xl">
            Trusted by thinkers<br />
            & doers everywhere.
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={cn(
                "bg-card border border-border/50 p-6 rounded-lg h-full",
                "hover:border-primary/30 hover:shadow-lg",
                "transition-all duration-300"
              )}
            >
              <StarRating rating={testimonial.rating} />
              <p className="text-lg font-medium text-foreground mb-4">
                "{testimonial.quote}"
              </p>
              <div className="mt-auto pt-4 border-t border-border/30">
                <p className="font-bold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedTransition>
  );
};
