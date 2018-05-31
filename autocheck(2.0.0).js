(function () {
	
	class AutoCheck {

		constructor(oTitle, oSubscribers, originalCurrency) {

			this.title = oTitle;
			this.scope = aScope;
			this.scope[2].checked = true;
			this.isSitewide = false;
			this.subscribers = {};
			this.subscribe(oSubscribers);
			this.originalCurrency = originalCurrency;
			this.specialCustomers = ['student', 'new customer'];
			this.shippingKeywords = [' shipping', ' delivery', ' p&p', ' postage', ' click and collect', ' click & collect', ' shipment', ' s&h', ' carriage', ' freight'];
			this.sitewideKeywords = [
				'everything',
				'any order',
				'any purchase',
				'any item',
				'all orders',
				'all products',
				'all purchases',
				'sitewide',
				'site wide',
				'site-wide',
				'storewide',
				'store wide',
				'store-wide',
				'your order',
				'your purchase',
				'your first order',
				'your first purchase',
				'your next order',
				'your next purchase',
				'entire site',
				'whole site',
				'every order',
				'every purchase'
			];

			this.promoDetailKeywords = [

				{
					discount: [' off', 'save ', ' discount', ' saving', ' savings']
				},
				{
					free: ['free ', ' free', 'complimentary ']
				},
				{
					saleClearance: [' sale', ' sale ', ' clearance', 'clearance ', 'closeout ', ' closeout']
				},
				{
					rebate: [' rebate']
				},
				{
					reward: [' reward', ' bonus', ' cashback', ' cash back', ' point', ' credit']
				},
				{
					from: [' from ', ' start at ', ' starting at ', ' starts at', ' as low as ', ' as little as ', ' low to ']
				}

			];

			this.currencyReg = /(\$|€|£|Rs|RS\.|¥|₦|CHF|USD|CAD|GBP|POUND|RMB|AUD|INR|EUR|US\$|CA\$|AU\$)/gi;
			this.amountReg = /((\d{1,3},)?\d{1,3},\d{3}\.\d+)|((\d{1,3},)?\d{1,3},\d{3})|(\d+)/gi;
			this.percentReg = /(\d{1,2}\.\d+%)|(\d{1}\/\d{1})|(\d{1,2}%)/gi;
			this.bngnRegWithoutFree = /\d+ for \d+/gi;
			this.bngnRegWithFree = /get (?:the )?\d+(?:.*?)(?:for )?free/gi;


			this.publish();
		}

		subscribe(oSubscribers) {
			oSubscribers.forEach((val) => {
				let key = val.value;
				switch (key) {
					case 'percent':
						val = {
							selfNode: val,
							relatedNodes: [val.parentElement.nextElementSibling]
						};
						break;
					case 'money':
					case 'from':
						val = {
							selfNode: val,
							relatedNodes: [val.parentElement.nextElementSibling, val.parentElement.nextElementSibling.nextElementSibling]
						};
						break;
					default:
						val = { selfNode: val, relatedNodes: [] };
						break;
				}
				key = key.includes('_') ? key.replace(/_(?<char>\w)/g, (res, char) => char.toUpperCase()) : key;
				this.subscribers[key] = val;

			});
		}


		getCurrency(currency) {
			switch (currency) {
				case '$':
				case 'usd':
				case 'cad':
				case 'aud':
				case 'us$':
				case 'ca$':
				case 'au$':
					currency = 'dollar';
					break;
				case '£':
				case 'gbp':
				case 'pound':
					currency = 'pound';
					break;
				case '€':
				case 'eur':
					currency = 'euro';
					break;
				case 'rmb':
				case '¥':
				case 'cny':
					currency = 'rmb';
					break;
				case 'rs':
				case 'inr':
				case 'rs.':
					currency = 'rupee';
					break;
				case '₦':
					currency = 'naira';
					break;
				case 'chf':
					currency = 'chf';
					break;
			}
			return currency;
		}


		getPercentData(percentMatchRes) {
			let percentNumber = 0;
			percentNumber = percentMatchRes.includes('/') ? Number.parseFloat(eval(percentMatchRes) * 100) : Number.parseFloat(percentMatchRes);
			return Number.isInteger(percentNumber) ? percentNumber : percentNumber.toFixed(2);
		}

		getMoneyData(currencyMatchRes, amountMatchRes) {

			let currency = this.getCurrency(currencyMatchRes[0]);

			let amount = 0;

			if (amountMatchRes.length > 1) {
				amount = Math.min(...amountMatchRes.map((v) => Number.parseFloat(v.replace(',', ''))));
			} else {
				amount = Number.parseFloat(amountMatchRes[0].replace(',', ''));
			}

			amount = Number.isInteger(amount) ? amount : amount.toFixed(2);

			return { currency, amount };
		}

		assignPromoDetailInfo(promoDetailInfo, percentArr, amountArr, fromArr, moneyCurrency, fromCurrency) {

			if (percentArr.length > 0) {
				promoDetailInfo.percent = Math.max(...percentArr);
			}

			if (amountArr.length > 0) {
				promoDetailInfo.money = { currency: moneyCurrency, amount: Math.max(...amountArr) };
			}

			if (fromArr.length > 0) {
				promoDetailInfo.from = { currency: fromCurrency, amount: Math.min(...fromArr) };
			}

			return promoDetailInfo;

		}


		confirmFreeType(str) {

			if (this.shippingKeywords.find((v) => str.includes(v))) {
				return 'freeShipping';
			} else if (str.includes(' sample')) {
				return 'freeSample';
			} else if (str.includes(' download')) {
				return 'freeDownload';
			} else if (str.includes(' trial')) {
				return 'freeTrial';
			} else if (null !== str.match(this.bngnRegWithFree)) {
				return 'bngn';
			} else {
				return 'freeGift';
			}
		}

		getBasicPromoDetailType(str) {

			let typeArr = [];

			this.promoDetailKeywords.forEach((v) => {

				let key = Object.keys(v)[0];
				if (v[key].find((keyword) => str.includes(keyword))) {
					typeArr.push(key);
				}
			});

			return typeArr;

		}


		getSpecificPromoDetailInfo(splitArr) {
			let $ = this;
			let promoDetailInfo = {};
			let percentArr = [];
			let amountArr = [];
			let fromArr = [];
			let freeTypeArr = [];
			let moneyCurrency = '';
			let fromCurrency = '';


			splitArr.forEach((titleValueFragment) => {

				let typeArr = $.getBasicPromoDetailType(titleValueFragment);

				if (typeArr.length > 0) {

					typeArr.forEach((type) => {

						let currencyMatchRes = titleValueFragment.match($.currencyReg);
						let amountMatchRes = titleValueFragment.match($.amountReg);
						let percentMatchRes = titleValueFragment.match($.percentReg);


						switch (type) {
							case 'discount':
								if (titleValueFragment.includes('/') || titleValueFragment.includes('%')) {
									if (null !== percentMatchRes) {
										percentArr.push($.getPercentData(percentMatchRes[0]));
									}
								} else {
									if (null !== currencyMatchRes && null !== amountMatchRes) {
										let { currency, amount } = $.getMoneyData(currencyMatchRes, amountMatchRes);
										moneyCurrency = currency;
										amountArr.push(amount);
									}
								}
								break;
							case 'from':

								if (null !== currencyMatchRes && null !== amountMatchRes) {
									let { currency, amount } = $.getMoneyData(currencyMatchRes, amountMatchRes);
									fromCurrency = currency;
									fromArr.push(amount);
								}
								break;
							case 'free':
								if (!freeTypeArr.includes($.confirmFreeType(titleValueFragment))) {
									freeTypeArr.push($.confirmFreeType(titleValueFragment));
								}
								break;
							case 'saleClearance':
								if ((!this.isSitewide) && (!titleValueFragment.includes('non sale'))) {
									promoDetailInfo.saleClearance = true;
								}
								break;
							default:
								promoDetailInfo[type] = true;
								break;
						}

					});

				} else {

					if (null !== titleValueFragment.match($.bngnRegWithoutFree)) {
						promoDetailInfo.bngn = true;
					}

				}

			})

			freeTypeArr.forEach((freeType) => {
				promoDetailInfo[freeType] = true;
			});

			promoDetailInfo = $.assignPromoDetailInfo(promoDetailInfo, percentArr, amountArr, fromArr, moneyCurrency, fromCurrency);

			return promoDetailInfo;

		}


		floatToString(float) {
			let floatString = float.toString();
			if (floatString.lastIndexOf('.') === 2) {
				floatString = floatString.replace(/(?<matched>\.\d{1})$/gi, '$<matched>' + '0');
			}
			return floatString;
		}

		notify(promoDetailInfo) {

			let $ = this;

			Object.keys($.subscribers).forEach((key) => {

				let domNode = $.subscribers[key];

				if (promoDetailInfo.hasOwnProperty(key)) {
					domNode.selfNode.checked = true;
					if (domNode.relatedNodes.length === 1) {
						domNode.relatedNodes[0].value = $.floatToString(promoDetailInfo[key]);
					} else if (domNode.relatedNodes.length === 2) {
						domNode.relatedNodes[0].value = promoDetailInfo[key].currency;
						domNode.relatedNodes[1].value = $.floatToString(promoDetailInfo[key].amount);
					}
				}
				else {

					domNode.selfNode.checked = false;
					if (domNode.relatedNodes.length === 1) {
						domNode.relatedNodes[0].value = '';
					} else if (domNode.relatedNodes.length === 2) {
						domNode.relatedNodes[0].value = $.originalCurrency;
						domNode.relatedNodes[1].value = '';
					}
				}
			})

		}


		splitTitleValue(titleValue) {

			let delimiter = [' + ', ', ', ' & ', ' plus ', ' and '];

			let splitArr = delimiter.map((v) => titleValue.split(v));

			let lengthArr = splitArr.map((v) => v.length);

			return splitArr[lengthArr.indexOf(Math.max(...lengthArr))];

		}

		handleSitewide(titleStr) {
			let isSpecial = this.specialCustomers.find((special) => titleStr.includes(special));

			if (isSpecial) {
				this.scope[0].checked = false;
				this.scope[2].checked = true;
				this.isSitewide = false;
				return false;
			}
			let isSitewide = this.sitewideKeywords.find((keyword) => titleStr.includes(keyword));
			this.isSitewide = isSitewide ? true : false;
			this.scope[0].checked = this.isSitewide;
			this.scope[2].checked = !this.isSitewide;
		}

		publish() {
			let $ = this;
			this.title.addEventListener('input', function () {
				if (this.value === '') return;
				let titleStr = this.value.toLowerCase();
				$.handleSitewide(titleStr);
				let splitArr = $.splitTitleValue(titleStr);
				let promoDetailInfo = $.getSpecificPromoDetailInfo(splitArr);
				if (Object.keys(promoDetailInfo).length < 1) {
					promoDetailInfo.other = true;
				}
				$.notify(promoDetailInfo);
			});
		}

	}


	let aScope = document.querySelectorAll("input[name='scope_apply']");
	let oTitle = document.querySelector('#title');
	let aCheckboxes = document.querySelectorAll('#PromotionDetail > div > p > span > input[type=checkbox]');
	let originalCurrency = document.querySelector("[name='money_type[money]']").value;


	let autoCheck = new AutoCheck(oTitle, aCheckboxes, originalCurrency, aScope);
	autoCheck.publish();
})();