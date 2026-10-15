import { href } from '../../router';
import { moreItems } from '../../shell/navItems';
import { BackLink } from '../../ui/BackLink';
import { Icon } from '../../ui/Icon';
import { PageHeader } from '../../ui/PageHeader';

/** Phone and tablet: the quieter tools in one place. (Desktop lists them in the sidebar.) */
export function MoreScreen() {
  return (
    <>
      <BackLink to="today" label="Today" />
      <PageHeader title="More" subtitle="Quiet tools, whenever you want them" showStreak={false} />
      <ul className="more-list">
        {moreItems.map((item) => (
          <li key={item.route}>
            <a className="card more-item" href={href(item.route)}>
              <span className="more-item__icon" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              <span className="more-item__text">
                <span className="more-item__label">{item.label}</span>
                <span className="more-item__description">{item.description}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
