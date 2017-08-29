const getParam = (name) => {
	name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
	const regexS = '[\\?&]' + name + '=([^&#]*)';
	const regex = new RegExp(regexS);
	const results = regex.exec(window.location.search);
	if (!results) return '';
	return decodeURIComponent(results[1].replace(/\+/g, ' '));
};

export { getParam };
