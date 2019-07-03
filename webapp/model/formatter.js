sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue : function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		
		formatStatusText: function(sValue){
			if (!sValue){
				return "";
			}
			return this.getResourceBundle().getText("statusText_" + sValue);
		},
		
		formatStatusColor: function(sValue){
			if(!sValue){
				return "None";
			}
			return this.getResourceBundle().getText("statusColor_" + sValue);
		},
		
		getDev: function(sValue){
			if(!sValue){
				return "";
			}
			
			var model = this.getModel().getData();
			var dev = model.desenvolvedores.filter((x) => x.id == sValue);
			
			return dev[0].nome;
		}
	};
});