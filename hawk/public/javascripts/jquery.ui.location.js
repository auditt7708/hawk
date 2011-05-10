//======================================================================
//                        HA Web Konsole (Hawk)
// --------------------------------------------------------------------
//            A web-based GUI for managing and monitoring the
//          Pacemaker High-Availability cluster resource manager
//
// Copyright (c) 2011 Novell Inc., Tim Serong <tserong@novell.com>
//                        All Rights Reserved.
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of version 2 of the GNU General Public License as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it would be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
//
// Further, this software is distributed without any warranty that it is
// free of the rightful claim of any third person regarding infringement
// or the like.  Any license provided herein, whether implied or
// otherwise, applies only to this software file.  Patent licenses, if
// any, provided herein do not apply to combinations of this program with
// other software, or any other product whatsoever.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write the Free Software Foundation,
// Inc., 59 Temple Place - Suite 330, Boston MA 02111-1307, USA.
//
//======================================================================

// Note: this requires ui.expression

(function($) {
  $.widget("ui.location", {
    options: {
      rules: [],
      nodes: [],
      labels: {
        score: "Score",
        node: "Node",
        role: "Role",
        bool_op: "Boolean Op",
        expr: "Expression"
      },
      prefix: "",
      dirty: null
    },

    valid: function() {
      var self = this;
      // It's valid if all required fields have a value,
      // and for copmlex constraints if all rules have at least
      // one expression.
      var valid = true;
      $(".req").each(function() {
        if (!$.trim($(this).val())) {
          valid = false;
          return false;
        }
      });
      if (valid && !self._is_simple()) {
        // This test only works if there's a single rule.
        valid = $(".req").length > 1;
      }
      return valid;
    },

    // This will need to be changed to work based on the form once
    // we have the ability to switch between simple and advanced views.
    _is_simple: function() {
      var self = this;
      var rules = self.options.rules;
      return rules.length == 0 ||
        rules.length == 1 && rules[0].expressions.length == 1 &&
        rules[0].score && rules[0].expressions[0].value &&
        rules[0].expressions[0].attribute == "#uname" &&
        rules[0].expressions[0].operation == "eq";
    },

    _create: function() {
      var self = this;
      var e = self.element;
      e.addClass("ui-location");
    },

    _init: function() {
      var self = this;
      if (self._is_simple()) {
        self._init_simple();
      } else {
        self._init_complex();
      }
    },

    _init_simple: function() {
      var self = this;

      var node = "";
      var score = "";
      if (self.options.rules.length && self.options.rules[0].expressions.length) {
        score = self.options.rules[0].score;
        node = self.options.rules[0].expressions[0].value;
      }
      var e = self.element;
      e.children().remove();
      e.append($("<table>" +
          "<tr><th>" + escape_html(self.options.labels.score) + "</th><th>" + escape_html(self.options.labels.node) + "</th></tr>" +
          "<tr>" +
            '<td><input class="req" type="text" ' + self._field_name("score") + ' value="' + escape_field(score) + '"/></td>' +
            "<td>" + self._select(self._field_name("expressions", "value"), self.options.nodes, node, "req") +
              '<input type="hidden" ' + self._field_name("expressions", "attribute") + ' value="#uname"/>' +
              '<input type="hidden" ' + self._field_name("expressions", "operation") + ' value="eq"/></td>' +
          "</tr>" +
        "</table>"));
      e.find("input[type=text]").bind("keyup change", function(event) {
        self._trigger("dirty", event, {});
      }).blur(function(event) {
        var v = $.trim(this.value);
        if (v != this.value) {
          this.value = v;
          self._trigger("dirty", event, {});
        }
      });
      e.find("select").change(function(event) {
        self._trigger("dirty", event, {});
      });
    },

    _init_complex: function() {
      var self = this;

      var score = "";
      var role = "";
      var bool_op = "";
      if (self.options.rules.length) {
        score = self.options.rules[0].score;
        role = self.options.rules[0].role;
        bool_op = self.options.rules[0].boolean_op;
      }
      var e = self.element;
      e.children().remove();
      e.append($("<table>" +
          "<tr>" +
            "<th>" + escape_html(self.options.labels.score) + "</th>" +
            "<th>" + escape_html(self.options.labels.role) + "</th>" +
            "<th>" + escape_html(self.options.labels.bool_op) + "</th>" +
          "</tr>" +
          "<tr>" +
            '<td><input class="req" type="text" ' + self._field_name("score") + ' value="' + escape_field(score) + '"/></td>' +
            "<td>" + self._select(self._field_name("role"), ["", "Started", "Master", "Slave"], role, "short") + "</td>" +
            "<td>" + self._select(self._field_name("boolean_op"), ["", "and", "or"], bool_op, "short") + "</td>" +
          "</tr>" +
          "<tr>" +
            '<th colspan="3" style="padding-top: 0.5em;">' + escape_html(self.options.labels.expr) + "</th>" +
          "</tr>" +
          "<tr>" +
            '<td colspan="3"><div></div></td>' +
          "</tr>" +
        "</table>"));
      e.find("div").expression({
          exprs: [],
          // TODO(must): Labels
          prefix: self.options.prefix + "[][expressions]",
          dirty: function(e, o) { self._trigger("dirty", e, o); }
        });
      e.find("input[type=text]").bind("keyup change", function(event) {
        self._trigger("dirty", event, {});
      });
      e.find("select").change(function(event) {
        self._trigger("dirty", event, {});
      });
    },

    // Note: Surprisingly similar to function in ui.constraint.js
    _field_name: function(n, x) {
      var self = this;
      n = self.options.prefix + "[][" + n + "]" + (x ? "[][" + x + "]" : "");
      return 'id="' + n.replace(/]/g, "").replace(/\[/g, "_") + '" name="' + n + '"';
    },

    _select: function(idn, opts, value, class) {
      var s = "<select " + idn + (class ? ' class="' + class + '"' : "") + ">";
      if (value == "" && !$.inArray(value, "")) {
        s += "<option></option>";
      } else if ($.inArray(value, opts) == -1) {
        s += "<option>" + escape_html(value) + "</option>";
      }
      $.each(opts, function(i, n) {
        s += "<option" + (n == value ? ' selected="selected"' : "") + ">" + escape_html(n) + "</option>";
      });
      s += "</select>";
      return s;
    }

  });
})(jQuery);
