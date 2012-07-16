# Simple javascript template engine.

## Syntax

### if 
```
{%if expression%}
 ...
{%elif expression%}
 ...
{%elseif expression%}
 ...
{%else if expression%}
 ...
{%else%}
 ...
{%endif%}
```
### each
```
{%foreach data as value,index%}
 ...
{%endforeach%}
 ...
{%each data as value,index%}
 ...
{%endeach%}
```
### var
```
{%varname=expression%}
```
### expression
other expression will output

```
{% true ? 'will out put this' : 'not arrive here' %}
```

## Usage

```
var t = new Template(tplstring);
t.render(data);
```

for better use, you must assign all variables to data used in tplstring.
