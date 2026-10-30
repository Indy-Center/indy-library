import { mdiBookOpenVariant, mdiFormatListChecks } from '@mdi/js';

/**
 * The library's sections: the header's nav, the footer's Library column and the error page's
 * links. Left untyped so it fits both `NavItem` and `ErrorPageLink`.
 */
export const SECTIONS = [
	{ label: 'Courses', href: '/', icon: mdiBookOpenVariant },
	{ label: 'Competencies', href: '/competencies', icon: mdiFormatListChecks }
];
