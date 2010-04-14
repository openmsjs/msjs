//htmlunit is unable to drive this test
var select = $(<select>
    <option>one</option>
    <option>two</option>
    <option>three</option>
</select>).appendTo("body");


var input = $(<input/>).appendTo("body");

var selectOutput= $(<div>foo</div>).appendTo("body");
select.change(function(){
    selectOutput.text(select.val());
});


var inputOutput= $(<div> bar</div>).appendTo("body");
input.change(function(){
    inputOutput.text(input.val());
});
