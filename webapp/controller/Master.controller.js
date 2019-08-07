sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter) {
	"use strict";

	return BaseController.extend("manageprojects.manageprojects.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit : function () {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel();


			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter : [],
				aSearch : []
			};

			this.setModel(oViewModel, "masterView");
			
			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		_getAddFrag: function(){ //Using singleton 
			if(!this.addFrag){
				this.addFrag = sap.ui.xmlfragment("manageprojects.manageprojects.fragment.AddProject", this);
				this.getView().addDependent(this.addFrag);
			}
			
			return this.addFrag;
		},
		
		openAdd: function(oEvent){
			this._getAddFrag().openBy(oEvent.getSource());
		},

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}
 
			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				var aFilter = new Filter("nome", FilterOperator.Contains, sQuery);
			}

			this._oList.getBinding("items").filter(aFilter);
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings : function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "manageprojects.manageprojects.view.ViewSettingsDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog : function (oEvent) {

			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		selectProject : function (oEvent) {
			//var oList = oEvent.getSource(),
			//	bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},
		
		createNewProject: function(oEvent){
			//Some Teste
			var model = this.getView().getModel(),
				localData = model.getData(),
				index = localData.projetos.length,
				popOver = oEvent.getSource().getParent().getParent(),
				fElements = popOver.getAggregation("content")[0].getAggregation("items")[0].getAggregation("formContainers")[0].getAggregation("formElements"),
				name = fElements[0].getAggregation("fields")[0].getValue();
			
			localData.projetos[index] = {nome: name, id: index + 1};
			this.getView().getModel().setData(localData);
			
			this.createObjectToSave(index + 1, fElements);
			this.removeFieldsPopOver(fElements);
			//Close popover
			popOver.close();
		},
		
		createObjectToSave: function(idProj, elements){
			var toSave = [];
			
			//variavel i = 1 para ignorar o nome do projeto
			for(var i = 1; i < elements.length; i++){
				var ativ = elements[i].getFields()[0].getItems()[1].getValue();
				var resp = elements[i].getFields()[1].getItems()[1].getSelectedKey();
				var status = elements[i].getFields()[2].getItems()[1].getItems()[0].getSelectedKey();
				
				toSave.push({
					atividade: ativ,
					responsavel: resp,
					status: status
				});
			}
			
			this.saveAtividades(toSave, idProj);
		},
		
		saveAtividades: function(toSave, idProj){
			var model = this.getView().getModel(),
				localData = model.getData(),
				index = localData.atividades.length;
			
			for(var i = 0; i < toSave.length; i++){
				localData.atividades[index + i] = {
					descricao: toSave[i].atividade,
					idDev: Number(toSave[i].responsavel),
					status: toSave[i].status,
					idProj: Number(idProj)
				};
			}
			
			this.getView().getModel().setData(localData);
		},
		
		removeFieldsPopOver: function(elements){
			for(var i = 0; i < elements.length; i++){
				
				if(i === 0){ 
					elements[i].getAggregation("fields")[0].setValue(""); 
					continue;
				}
				
				elements[i].destroy();
			}
		},
		
		/**
		 * Adicionar campos para inserção de nova atividade na tela
		 */
		 
		 addNewActivitie: function(oEvent){
		 	var popOver = oEvent.getSource().getParent().getParent();
			var form = popOver.getAggregation("content")[0].getAggregation("items")[0]; 
			
			var newElement = new sap.ui.xmlfragment("manageprojects.manageprojects.fragment.NewActivity", this);
			
			form.getAggregation("formContainers")[0].addFormElement(newElement);
		 },
		 
		 onDeleteActivity: function(oEvent){
		 	var formElement = oEvent.getSource().getParent().getParent().getParent();
		 	//formElement.removeAllFields();
		 	
		 	//Gambiarra para evitar o fechamento do popover
		 	formElement.getParent().getAggregation("formElements")[0].getAggregation("fields")[0].focus();
		 	formElement.destroy();
		 },

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed : function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader : function (oGroup) {
			return new GroupHeaderListItem({
				title : oGroup.text,
				upperCase : false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_createViewModel : function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Address/AddressType",
				groupBy: "None"
			});
		},

		_onMasterMatched :  function() {
			this.getModel("appView").setProperty("/busy", false);
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
			
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail : function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId : oItem.getBindingContext().getProperty("id"),
				objectName : oItem.getBindingContext().getProperty("nome")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar : function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		}

	});

});