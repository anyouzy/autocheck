
//version 2.4

(function () {

	window.onload = null;//待删除

	class AutoCheck {

		constructor(oTitle, oSubscribers, defaultCurrencySymbol, aScope, aState) {
			this.siteLanguage = this.getSiteLanguage();//站点语言
			this.title = oTitle;//title DOM对象
			this.scope = aScope;//scope DOM对象
			this.state = aState;//scope DOM对象
			this.isSitewide = false;//记录当前sitewide状态
			this.isInstore = false;//记录当前Instore状态
			this.subscribers = {};//title input事件的订阅者
			//常用连接符号
			this.delimiter = [' + ', ', ', ' & ', ' plus ', '; ',];
			this.defaultCurrencySymbol = defaultCurrencySymbol;//页面最初货币符号
			//特殊人群
			this.specialCustomers = {
				en: ['student', 'new customer'],
				de: [],//待补充
				fr: [],//待补充
			};
			//邮寄,邮费关键词
			this.shippingKeywords = {
				en: [' shipping', ' delivery', ' p&p', ' postage', ' click and collect', ' click & collect', ' shipment', ' s&h', ' carriage', ' freight'],
				de: [],//待补充
				fr: [],//待补充
			};
			//instore 关键词
			this.instoreKeywords = {
				en: ['in store', 'in-store', 'store only'],
				de: [],//待补充
				fr: [],//待补充
			};
			//全场关键词 
			this.sitewideKeywords = {
				en: [
					'everything',
					'any order',
					'any purchase',
					'any item',
					'any one item',
					'all orders',
					'all products',
					'all purchases',
					'all the products',
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
					'every purchase',
				],
				de: [],//待补充
				fr: [],//待补充
			};
			//promoDetail关键词分类
			this.promoDetailKeywords = {
				en: [
					{
						discount: [' off', 'save ', ' discount', ' saving', ' savings']
					},
					{
						free: ['free ', ' free', 'complimentary']
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
					{	// ' and up', ' & up' 待处理
						from: [' from ', ' start at ', ' starting at ', ' starts at', ' as low as ', ' as little as ', ' low to ']
					},
				],
				de: [],//待补充
				fr: [],//待补充
			};
			//money正则
			this.moneyReg = /((?<startSymbol>\$|€|£|Rs|RS\.|¥|₦|CHF|USD|CAD|GBP|POUND|RMB|AUD|INR|EUR|US\$|CA\$|AU\$)\s?(?<endAmount>(\d{1,3},){0,3}\d+(\.\d+)?))|((?<startAmount>(\d{1,3},){0,3}\d+(\.\d+)?)\s?(?<endSymbol>\$|€|£|Rs|RS\.|¥|₦|CHF|USD|CAD|GBP|POUND|RMB|AUD|INR|EUR|US\$|CA\$|AU\$))/gi;
			//percent off 正则
			this.percentReg = /((\d{1,2}(\.\d+)?%)|(\d{1,3}\/\d{1,3}))/gi;
			//xx for xx 的bngn正则(eg: 4 for 3)
			this.bngnRegWithFor = {
				en: /\d+ for \d+/gi,
				de: null,//待补充
				fr: null//待补充
			};
			//buy xx, get xx free 的bngn正则(eg: buy 2, get 1 free)
			this.bngnRegWithFree = {
				en: /get (?:the )?\d+(?:.*?)(?:for )?free/gi,
				de: null,//待补充
				fr: null,//待补充
			};
			//free money gift card的正则(eg:Free $10 Starbucks Gift Card)  
			this.moneyOffRegWithFree = {
				en: /(?:(?:free)|(?:complimentary))\s(?:.*?)(?:(?:gift cards?)|(?:gift vouchers?)|(?:gift certificates?)|(?:vouchers?)|(?:e-gift cards?)|(?:e-gift certificates?))/gi,
				de: null,//待补充
				fr: null,//待补充
			};
			this.promoDetailInfo = {}; //记录promo detail信息
			this.scope[2].checked = true;//scope默认选择other
			this.addSubscribers(oSubscribers);//添加订阅者
			//构造函数里面直接执行exec方法，让CPQ添加促销时候，不用去改变title value，也能自动勾选promo detail
			this.exec();
		}
		/**
		 * [getSiteLanguage 获取站点语言]
		 * @return {String} [站点语言]
		 */
		getSiteLanguage() {
			let reg = /site=cs(?<site>\w{2})/gi;
			let site = reg.exec(window.location.search).groups.site;
			let siteLanguage = '';
			switch (site) {
				case 'us':
				case 'uk':
				case 'au':
				case 'ca':
				case 'in':
					siteLanguage = 'en';
					break;
				case 'de':
					siteLanguage = 'de';
					break;
				case 'fr':
					siteLanguage = 'fr';
					break;
			}
			return siteLanguage;
		}
		/**
		 * [addSubscribers 注册所有的checkbox DOM节点 ]
		 * @param  {Object} oSubscribers [所有的promodetail checkbox DOM节点]
		 * @return {undefined}              
		 */
		addSubscribers(oSubscribers = {}) {
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
		/**
		 * [getCurrencySymbol 获取货币符号]
		 * @param  {String} currency [各种货币符号的表示]
		 * @return {String}          [货币符号]
		 */
		getCurrencySymbol(currency = '') {
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
		/**
		 * [getPercentData 获取百分比数字]
		 * @param  {String} percentMatchRes [百分比正则匹配结果]
		 * @return {Number}                 [百分比数字]
		 */
		getPercentData(percentMatchRes = '') {
			let percentNumber = 0;
			percentNumber = percentMatchRes.includes('/') ? Number.parseFloat(eval(percentMatchRes) * 100) : Number.parseFloat(percentMatchRes);
			return Number.isInteger(percentNumber) ? percentNumber : percentNumber.toFixed(2);
		}
		/**
		 * [getMoneyData 获取货币符号和金额]
		 * @return {Object}                  [货币符号和金额对象]
		 */
		getMoneyData(titleValueFragment) {
			let moneyMatchRes = null;
			let amount = -1;
			let currencySymbol = '';
			let amountMatchRes = [];
			while (null !== (moneyMatchRes = this.moneyReg.exec(titleValueFragment))) {
				let groups = moneyMatchRes.groups;
				currencySymbol = this.getCurrencySymbol(groups.startSymbol || groups.endSymbol);
				amountMatchRes.push(groups.endAmount || groups.startAmount);
			}
			if (amountMatchRes.length > 1) {
				amount = Math.min(...amountMatchRes.map((v) => Number.parseFloat(v.replace(/,/g, ''))));
			} else if (amountMatchRes.length === 1) {
				amount = Number.parseFloat(amountMatchRes[0].replace(/,/g, ''));
			}
			amount = Number.isInteger(amount) ? amount : amount.toFixed(2);
			return { currencySymbol, amount };
		}
		/**
		 * [assignPromoDetailInfo 根据多个百分比取最大，多个money off取最大，多个from取最小，合并promodetail信息]
		 * @param  {Array}  percentArr     	 		[百分比数值数组]
		 * @param  {Array}  amountArr       		[money off类型的货币金额数组]
		 * @param  {Array}  fromArr         		[from类型的货币金额数组]
		 * @param  {String} offCurrencySymbol   	[money off类型的货币符号]
		 * @param  {String} fromCurrencySymbol    	[from类型的货币符号]
		 */
		assignPromoDetailInfo(percentArr = [], amountArr = [], fromArr = [], offCurrencySymbol = '', fromCurrencySymbol = '') {
			if (percentArr.length > 0) {
				this.promoDetailInfo.percent = Math.max(...percentArr);
			}

			if (amountArr.length > 0) {
				this.promoDetailInfo.money = { currencySymbol: offCurrencySymbol, amount: Math.max(...amountArr) };
			}

			if (fromArr.length > 0) {
				this.promoDetailInfo.from = { currencySymbol: fromCurrencySymbol, amount: Math.min(...fromArr) };
			}
		}
		/**
		 * [confirmFreeType 对free类型进行进一步判断，确认究竟属于哪一种promo detail]
		 * @param  {String} str [标题字符串片段]
		 * @return {String}     [确认后的promo detail]
		 */
		confirmFreeType(str = '') {
			if (this.shippingKeywords[this.siteLanguage].find((v) => str.includes(v))) {
				return 'freeShipping';
			} else if (str.includes(' sample')) {
				return 'freeSample';
			} else if (str.includes(' download')) {
				return 'freeDownload';
			} else if (str.includes(' trial')) {
				return 'freeTrial';
			} else if (null !== str.match(this.bngnRegWithFree[this.siteLanguage])) {
				return 'bngn';
			} else if (null !== str.match(this.moneyOffRegWithFree[this.siteLanguage])) {
				return 'money';
			} else {
				return 'freeGift';
			}
		}
		/**
		 * [getBasicPromoDetailType 根据promodetail关键词，确认标题字符串片段所属的基本promo detail类型]
		 * @param  {String} str [标题字符串片段]
		 * @return {Array}     [基本promo detail类型数组]
		 */
		getBasicPromoDetailType(str = '') {
			let typeArr = [];
			this.promoDetailKeywords[this.siteLanguage].forEach((v) => {
				let key = Object.keys(v)[0];
				if (v[key].find((keyword) => str.includes(keyword))) {
					typeArr.push(key);
				}
			});
			return typeArr;
		}
		/**
		 * [getSpecificPromoDetailInfo 遍历拆分后的多个标题片段，提取promo detail特征以及相应的数据信息]
		 * @param  {Array}  splitArr          [被拆分了的标题字符串数组]
		 */
		getSpecificPromoDetailInfo(splitArr = []) {
			let percentArr = [];
			let amountArr = [];
			let fromArr = [];
			let freeTypeArr = [];
			let offCurrencySymbol = '';
			let fromCurrencySymbol = '';

			splitArr.forEach((titleValueFragment) => {
				let typeArr = this.getBasicPromoDetailType(titleValueFragment);
				if (typeArr.length === 0) {
					if (null !== titleValueFragment.match(this.bngnRegWithFor[this.siteLanguage])) {
						this.promoDetailInfo.bngn = true;
					}
					return;
				}
				typeArr.forEach((type) => {
					let percentMatchRes = titleValueFragment.match(this.percentReg);
					let { currencySymbol, amount } = this.getMoneyData(titleValueFragment);
					let tmpType = '';
					switch (type) {
						case 'discount':
							if (titleValueFragment.includes('/') || titleValueFragment.includes('%')) {
								if (null !== percentMatchRes) percentArr.push(this.getPercentData(percentMatchRes[0]));
							} else {
								if (amount !== -1) {
									offCurrencySymbol = currencySymbol;
									amountArr.push(amount);
								}
							}
							break;
						case 'from':
							if (amount !== -1) {
								fromCurrencySymbol = currencySymbol;
								fromArr.push(amount);
							}
							break;
						case 'free':
							tmpType = this.confirmFreeType(titleValueFragment);
							if (tmpType === 'money') {
								if (amount !== -1) {
									offCurrencySymbol = currencySymbol;
									amountArr.push(amount);
								}
							} else {
								if (!freeTypeArr.includes(tmpType)) freeTypeArr.push(tmpType);
							}
							break;
						case 'saleClearance':
							if ((!this.isSitewide) && (!titleValueFragment.includes('non sale'))) {
								this.promoDetailInfo.saleClearance = true;
							}
							break;
						default:
							this.promoDetailInfo[type] = true;
							break;
					}
				});
				freeTypeArr.forEach((freeType) => {
					this.promoDetailInfo[freeType] = true;
				});
				this.assignPromoDetailInfo(percentArr, amountArr, fromArr, offCurrencySymbol, fromCurrencySymbol);
			});
		}
		/**
		 * [floatToString 浮点数转字符串，以便最终放入相应的DOM]
		 * @param  {Number} float [待转换的浮点数]
		 * @return {String}       [转换后的字符串]
		 */
		floatToString(float = 0.0) {
			let floatString = float.toString();
			if (floatString.substr(-2, 1) === '.') {
				floatString += '0';
			}
			return floatString;
		}
		/**
		 * [updateDOM 根据最终的promodetail信息，更新相应的DOM]
		 * @return {undefined}               
		 */
		updateDOM() {
			Object.keys(this.subscribers).forEach((key) => {
				let domNode = this.subscribers[key];
				if (this.promoDetailInfo.hasOwnProperty(key)) {
					domNode.selfNode.checked = true;
					if (domNode.relatedNodes.length === 1) {
						domNode.relatedNodes[0].value = this.floatToString(this.promoDetailInfo[key]);
					} else if (domNode.relatedNodes.length === 2) {
						domNode.relatedNodes[0].value = this.promoDetailInfo[key].currencySymbol;
						domNode.relatedNodes[1].value = this.floatToString(this.promoDetailInfo[key].amount);
					}
				}
				else {
					domNode.selfNode.checked = false;
					if (domNode.relatedNodes.length === 1) {
						domNode.relatedNodes[0].value = '';
					} else if (domNode.relatedNodes.length === 2) {
						domNode.relatedNodes[0].value = this.defaultCurrencySymbol;
						domNode.relatedNodes[1].value = '';
					}
				}
			})
		}
		/**
		 * [splitTitleValue 根据常用的连接符，对标题进行拆分]
		 * @param  {String} titleValue [标题内容]
		 * @return {Array}            [拆分后的数组]
		 */
		splitTitleValue(titleValue = '') {
			let splitArr = this.delimiter.map((v) => titleValue.split(v));
			let lengthArr = splitArr.map((v) => v.length);
			return splitArr[lengthArr.indexOf(Math.max(...lengthArr))];
		}
		/**
		 * [handleSitewide sitewide处理]
		 * @param  {String} titleStr [标题内容]
		 * @return {undefined}      
		 */
		handleSitewide(titleStr = '') {
			let isSpecial = this.specialCustomers[this.siteLanguage].find((special) => titleStr.includes(special));
			if (isSpecial) {
				this.scope[0].checked = false;
				this.scope[2].checked = true;
				this.isSitewide = false;
				return;
			}
			let isSitewide = this.sitewideKeywords[this.siteLanguage].find((keyword) => titleStr.includes(keyword));
			this.isSitewide = isSitewide ? true : false;
			this.scope[0].checked = this.isSitewide;
			this.scope[2].checked = !this.isSitewide;
		}
		/**
		 * [handleInstore instore处理]
		 * @param  {String} titleStr [标题内容]
		 * @return {undefined}
		 */
		handleInstore(titleStr = '') {
			let res = this.instoreKeywords[this.siteLanguage].find((v) => titleStr.includes(v));
			this.isInstore = res ? true : false;
			this.state[1].checked = this.isInstore;
		}
		/**
		 * [exec  程序主要逻辑]
		 * @return {undefined}
		 */
		exec() {
			if (this.title.value === '') return;
			let titleStr = this.title.value.toLowerCase();
			this.handleSitewide(titleStr);
			this.handleInstore(titleStr);
			let splitArr = this.splitTitleValue(titleStr);
			this.promoDetailInfo = {};
			this.getSpecificPromoDetailInfo(splitArr);
			if (Object.keys(this.promoDetailInfo).length < 1) {
				this.promoDetailInfo.other = true;
			}
			this.updateDOM(this.promoDetailInfo);
		}
		/**
		 * [bindEvent 监听title input事件]
		 * @return {undefined} 
		 */
		bindEvent() {
			this.title.addEventListener('input', () => {
				this.exec();
			});
		}
	}

	let aScope = document.querySelectorAll("input[name='scope_apply']");
	let aState = document.querySelectorAll("input[name='onlinestate[]']");
	let oTitle = document.querySelector('#title');
	let aCheckboxes = document.querySelectorAll('#PromotionDetail > div > p > span > input[type=checkbox]');
	let defaultCurrencySymbol = document.querySelector("[name='money_type[money]']").value;

	let autoCheck = new AutoCheck(oTitle, aCheckboxes, defaultCurrencySymbol, aScope, aState);
	autoCheck.bindEvent();

})();