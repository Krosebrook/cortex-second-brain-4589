import Search from '@/components/search';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { PageWrapper } from '@/components/layout/PageWrapper';

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  
  return (
    <PageWrapper containerSize="full" noPadding className="pt-24 pb-6">
      <AnimatedTransition show={showContent} animation="slide-up">
        <Search />
      </AnimatedTransition>
    </PageWrapper>
  );
};

export default SearchPage;
