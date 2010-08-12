# ruby runner.rb command

## Mike, Greg, Franziska Hinkelmann 


# Takes input from dvd website and passes it to M2 to compute fixed points
# returns 0 (no errors) or 1 (errors) 

unless ARGV.size == 1
  puts "Usage: ruby runner.rb command"
  exit 0
end

command = ARGV[0]


puts  "M2 --stop --no-debug --silent -q -e '#{command}; exit 0'"
result = `M2 --stop --no-debug --silent -q -e '#{command}; exit 0'`


puts result


exit 0

