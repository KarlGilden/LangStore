import {
	DEFAULT_LANGUAGE_ISO,
	isSupportedLanguageIso,
	SUPPORTED_LANGUAGES,
	type SupportedLanguageIso,
} from "@langstore/contracts";
import { useId, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useUpdateTargetLanguage } from "../../api/mutations/useUpdateTargetLanguage";
import { useSession } from "../../auth/useSession";
import { paths } from "../../router/paths";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";

export function LanguageSelector() {
	const { iso = DEFAULT_LANGUAGE_ISO } = useParams();
	const { isLoaded, isSignedIn } = useSession();
	const { pathname, search, hash } = useLocation();
	const navigate = useNavigate();
	const updateLanguage = useUpdateTargetLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const optionsId = useId();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [needsNativeLanguage, setNeedsNativeLanguage] = useState(false);
	const pendingLanguage = needsNativeLanguage
		? updateLanguage.variables?.targetLanguage
		: undefined;
	const selectedLanguage =
		SUPPORTED_LANGUAGES.find(
			(language) => language.iso === (pendingLanguage ?? iso),
		) ?? SUPPORTED_LANGUAGES[0];
	const isDisabled = !isLoaded || updateLanguage.isPending;

	const handleChange = async (
		language: string,
		nativeLanguage?: SupportedLanguageIso,
	) => {
		if (!isSupportedLanguageIso(language)) return;

		if (isSignedIn) {
			try {
				await updateLanguage.mutateAsync({
					targetLanguage: language,
					nativeLanguage,
				});
				setNeedsNativeLanguage(false);
			} catch (error) {
				if (
					error instanceof Error &&
					"status" in error &&
					error.status === 404
				) {
					setNeedsNativeLanguage(true);
				}
				return;
			}
		}

		const section = pathname.replace(/\/$/, "");
		const languageSections = [
			paths.collections(iso),
			paths.upload(iso),
			paths.review(iso),
		];
		if (isSignedIn && !languageSections.includes(section)) {
			await navigate(paths.collections(language));
			return;
		}

		const suffix = isSignedIn
			? section.slice(paths.languageHome(iso).length)
			: "";
		await navigate({
			pathname: paths.languageHome(language) + suffix,
			search,
			hash,
		});
	};

	return (
		<div>
			<div
				className="relative inline-flex"
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						setIsOpen(false);
					}
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape" && isOpen) {
						event.stopPropagation();
						setIsOpen(false);
						triggerRef.current?.focus();
					}
				}}
			>
				<button
					aria-controls={optionsId}
					aria-expanded={isOpen}
					aria-label={`Learning language: ${selectedLanguage.name}`}
					className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-muted/55 ps-1.5 pe-2.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-50"
					disabled={isDisabled}
					onClick={(event) => {
						event.currentTarget.focus();
						setIsOpen((open) => !open);
					}}
					ref={triggerRef}
					type="button"
				>
					<img
						alt=""
						height={28}
						src={flagPath(selectedLanguage.iso)}
						width={28}
					/>
					<ChevronRightIcon className="size-3.5 rotate-90 text-muted-foreground" />
				</button>
				<div
					aria-label="Learning languages"
					className="absolute end-0 top-full z-20 mt-2 min-w-36 space-y-0.5 rounded-3xl bg-card p-1.5 text-card-foreground shadow-lg"
					hidden={!isOpen}
					id={optionsId}
					role="group"
				>
					{SUPPORTED_LANGUAGES.map(({ iso, name }) => (
						<button
							aria-pressed={iso === selectedLanguage.iso}
							className="flex w-full cursor-pointer items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:font-semibold"
							key={iso}
							onClick={() => {
								setIsOpen(false);
								triggerRef.current?.focus();
								if (iso !== selectedLanguage.iso || updateLanguage.isError) {
									void handleChange(iso);
								}
							}}
							onMouseDown={(event) => event.preventDefault()}
							type="button"
						>
							<img alt="" height={22} src={flagPath(iso)} width={22} />
							{name}
						</button>
					))}
				</div>
			</div>

			{pendingLanguage && (
				<label className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
					<span>Native language</span>
					<select
						className="rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						disabled={updateLanguage.isPending}
						value=""
						onChange={(event) => {
							const nativeLanguage = event.currentTarget.value;
							if (isSupportedLanguageIso(nativeLanguage)) {
								void handleChange(pendingLanguage, nativeLanguage);
							}
						}}
					>
						<option value="" disabled>
							Choose to save
						</option>
						{SUPPORTED_LANGUAGES.map(({ iso, name }) => (
							<option key={iso} value={iso}>
								{name}
							</option>
						))}
					</select>
				</label>
			)}

			{updateLanguage.isError &&
				(!pendingLanguage || updateLanguage.variables?.nativeLanguage) && (
					<p className="mt-1 text-sm text-destructive" role="alert">
						Couldn’t save your preference. Choose a language again to retry.
					</p>
				)}
		</div>
	);
}

function flagPath(iso: SupportedLanguageIso) {
	return `./flags/${iso}.svg`;
}
