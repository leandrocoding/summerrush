import jlbIcon from '$lib/assets/JLBW.png';
import jldIcon from '$lib/assets/JLD.png';
import jleIcon from '$lib/assets/JLEH.png';
import jlnIcon from '$lib/assets/JLNH.png';
import jlsIcon from '$lib/assets/JLS.png';

const serverIcons = {
	JLB: jlbIcon,
	JLD: jldIcon,
	JLE: jleIcon,
	JLN: jlnIcon,
	JLS: jlsIcon
} as const;

export type ServerIconName = keyof typeof serverIcons;

export const defaultServerIcon = jleIcon;

export function serverIconFor(icon: string | undefined) {
	if (!icon) return defaultServerIcon;
	return serverIcons[icon as ServerIconName] ?? defaultServerIcon;
}
