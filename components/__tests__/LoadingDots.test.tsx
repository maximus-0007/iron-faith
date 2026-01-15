import { render } from '../../__tests__/test-utils';
import LoadingDots from '../LoadingDots';
import { View } from 'react-native';

describe('LoadingDots', () => {
  it('renders without crashing', () => {
    const { root } = render(<LoadingDots />);
    expect(root).toBeTruthy();
  });

  it('renders three dots', () => {
    const { UNSAFE_getAllByType } = render(<LoadingDots />);
    const views = UNSAFE_getAllByType(View);
    expect(views.length).toBeGreaterThanOrEqual(3);
  });
});
