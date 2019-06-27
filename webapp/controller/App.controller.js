sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/Controller"
], function (UIComponent, Controller) {
	"use strict";

	return Controller.extend("manageprojects.manageprojects.controller.App", {
		onInit: function () {

		},

		selectProject: function(oEvent) {
			debugger;
			var idProject = oEvent.getSource().getProperty("number");

			this.oRouter = UIComponent.getRouterFor(this);
			this.oRouter.navTo("detail", {idProject});

		}
	});
});