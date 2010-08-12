# ruby runner.rb command

## Mike, Greg, Franziska Hinkelmann 


# Takes input from dvd website and passes it to M2 to compute fixed points
# returns 0 (no errors) or 1 (errors) 


unless ARGV.size == 1
  puts "Usage: ruby runner.rb command<br>"
  puts ARGV.size 
  exit 0
end


command = ARGV[0]


puts "This is the command we'll run<br>"
puts  "M2 --stop --no-debug --silent -q -e '#{command}; exit 0'<br>"
result = `M2 --stop --no-debug --silent -q -e '#{command}; exit 0'`


puts "<pre> #{result} </pre><br>"
puts "<br>"


exit 0

