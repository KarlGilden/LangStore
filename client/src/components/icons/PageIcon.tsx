import { ICON_STROKE_WIDTH, Icon, type IconProps } from "./Icon";

export function PageIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M6.75 3.75h6.75l3.75 3.75v12.75H6.75V3.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
			<path d="M13.5 3.75V7.5h3.75M9.75 11.25h4.5M9.75 14.25h4.5M9.75 17.25h3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={ICON_STROKE_WIDTH} />
		</Icon>
	);
}
