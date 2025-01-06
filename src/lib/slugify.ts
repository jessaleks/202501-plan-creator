export const slugify = (...args: string[]): string => {
	const value = args.join(" ");

	return value
		.normalize("NFD") // split an accented letter in the base letter and the acent
		.replace(/[\u0300-\u036F]/g, "") // remove all previously split accents
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-"); // separator
};
