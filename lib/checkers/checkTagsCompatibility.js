/*
	eslint no-extra-parens: 0
*/

"use strict";

module.exports = (startWith, endWith, specificTag) => {

	return !(
		null !== specificTag &&
		((null !== startWith && null === endWith) || (null === startWith && null !== endWith))
	);

};
