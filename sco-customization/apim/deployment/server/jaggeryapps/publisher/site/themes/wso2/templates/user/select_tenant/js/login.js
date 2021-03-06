var select_tenant = function () {
	var selectedTenant = $("#tenantForm input[type='radio']:checked").val();
	console.log(selectedTenant);
	var compTenant = selectedTenant.split("::");
    var tenantDomain = compTenant[0];
    var role = compTenant[1];
    var isRoleProvider = role.indexOf("ROLE_PROVIDER") != -1;
    tenantDomain = tenantDomain.trim();
    $("#tenantForm button[type='button']").attr("disabled", true);
    $("#tenantForm button[type='button']").text('Redirecting...');
    jagg.post("/site/blocks/user/select_tenant/ajax/login.jag", { action:"login", tenant:tenantDomain, isRoleProvider:isRoleProvider },
              function (result) {
                  if (!result.error) { 
                      var current = window.location.pathname;
                      var currentHref=window.location.search;
                      var requestedPage=getParameterByName("requestedPage");
                      var queryParam;
                      //siteContext is a global variable set in page/base/template.jag with the Publisher site context
                      if (requestedPage && requestedPage.startsWith(siteContext)) {
                          window.location.href = requestedPage;
                      } else {
	                        if(currentHref.indexOf("tenant")>-1){queryParam=currentHref;}
	                        else{queryParam='';}
	                        if (current.indexOf(".jag") >= 0) {
	                            location.href = "index.jag"+queryParam;
	                        } else {
	                            location.href = 'site/pages/index.jag'+queryParam;
	                        }
                      }

                  } else {
                      var text = jQuery('<div />').text( result.message );
                      $('#loginErrorMsg').show();
                      //@todo: param_string
                      $('#loginErrorMsg').html('<i class="icon fw fw-error"></i><strong>'  + i18n.t("Error! ") +
                      '</strong>' + text.html() + '<button type="button" class="close" aria-label="close" data-dismiss="alert"><span aria-hidden="true"><i class="fw fw-cancel"></i></span></button>');
                      
                  }
              }, "json");
};

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
